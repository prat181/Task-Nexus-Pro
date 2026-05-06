from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class Role(str, enum.Enum):
    admin = "admin"
    member = "member"

class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in progress"
    done = "done"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(Role), default=Role.member)
    
    tasks = relationship("Task", back_populates="assignee")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"))

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")

# comment logic
class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    
    author = relationship("User")