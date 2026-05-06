from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List
import models
import database
import auth

# Initialize database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Task Nexus Pro")

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- SCHEMAS ---
class UserCreate(BaseModel):
    username: str  # Fixed 'slr' typo to 'str'
    password: str
    role: models.Role = models.Role.member

class TaskCreate(BaseModel):
    title: str
    project_id: int
    assignee_id: int

class ProjectCreate(BaseModel):
    name: str
    description: str

class CommentCreate(BaseModel):
    content: str

# --- AUTH DEPENDENCY ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except auth.jwt.JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- AUTH ROUTES ---
@app.post("/signup/")
def create_user(user: UserCreate, db: Session = Depends(database.get_db)):
    # Safety Check: Password length
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    
    db.add(new_user)
    db.commit()  # ESSENTIAL: Saves the user to the .db file permanently
    db.refresh(new_user)
    
    print(f"--- DEBUG: Created User '{new_user.username}' as {new_user.role} ---")
    return {"username": new_user.username, "role": new_user.role}

@app.post("/login/")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    print(f"--- DEBUG: Login attempt for user: '{form_data.username}' ---") 
    
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user:
        print(f"--- DEBUG: FAILURE - User '{form_data.username}' not found ---")
        raise HTTPException(status_code=401, detail="Incorrect username or password")
        
    if not auth.verify_password(form_data.password, user.hashed_password):
        print(f"--- DEBUG: FAILURE - Password mismatch for '{form_data.username}' ---")
        raise HTTPException(status_code=401, detail="Incorrect username or password")
        
    print(f"--- DEBUG: SUCCESS - {user.username} logged in ---")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- PROJECT & TASK ROUTES ---
@app.get("/projects/")
def get_projects(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Project).all()

@app.post("/projects/")
def create_project(project: ProjectCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.admin:
        raise HTTPException(status_code=403, detail="Only Admins can create projects")
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/tasks/")
def get_tasks(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # RBAC: Members only see their own tasks; Admins see everything
    if current_user.role == models.Role.admin:
        return db.query(models.Task).all()
    return db.query(models.Task).filter(models.Task.assignee_id == current_user.id).all()

@app.post("/tasks/")
def create_task(task: TaskCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/tasks/{task_id}/status")
def update_task_status(task_id: int, status: models.TaskStatus, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = status
    db.commit()
    return task

# --- COMMENT ROUTES ---
@app.post("/tasks/{task_id}/comments")
def add_comment(task_id: int, comment: CommentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_comment = models.Comment(content=comment.content, task_id=task_id, author_id=current_user.id)
    db.add(new_comment)
    db.commit()
    return {"message": "Comment added"}

@app.get("/tasks/{task_id}/comments")
def get_comments(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Comment).filter(models.Comment.task_id == task_id).all()

# --- SYSTEM & DASHBOARD ---
@app.get("/users/")
def get_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.User).all()

@app.get("/dashboard/")
def get_dashboard_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    total_tasks = db.query(models.Task).count()
    completed_tasks = db.query(models.Task).filter(models.Task.status == models.TaskStatus.done).count()
    return {
        "total_tasks": total_tasks, 
        "completed": completed_tasks, 
        "pending": total_tasks - completed_tasks
    }

@app.get("/")
def read_root():
    return {"message": "API is running"}
