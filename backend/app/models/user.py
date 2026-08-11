from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    working_id = Column(String(100), nullable=True)
    role = Column(String(30), default="ADMIN", nullable=False)

    audit_logs = relationship("AuditLog", back_populates="user")