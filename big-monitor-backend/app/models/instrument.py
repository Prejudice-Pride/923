from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from app import db

class Instrument(db.Model):
    __tablename__ = "instrument"

    # 主键字段
    id = db.Column(db.BigInteger, primary_key=True)
    
    # 其他字段
    stationId = db.Column(db.String(255))
    region = db.Column(db.String(255))
    pointId = db.Column(db.Integer)
    lat = db.Column(db.Float)
    lon = db.Column(db.Float)
    instrId = db.Column(db.String(255))
    stackNo = db.Column(db.Integer)
    instrcode = db.Column(db.String(255))
    sampleRate = db.Column(db.String(255))
    type = db.Column(db.String(255))
    style = db.Column(db.String(255))
    discipline = db.Column(db.String(255))
    startDate = db.Column(db.DateTime)
    endDate = db.Column(db.DateTime)
    instrProject = db.Column(db.String(255))
    dcunitCode = db.Column(db.String(255))
    illeagle = db.Column(db.String(255))
    registerFlag = db.Column(db.SmallInteger)  # tinyint映射为SmallInteger
    status = db.Column(db.SmallInteger)  # tinyint映射为SmallInteger
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "stationId": self.stationId,
            "region": self.region,
            "pointId": self.pointId,
            "lat": float(self.lat) if self.lat else None,
            "lon": float(self.lon) if self.lon else None,
            "instrId": self.instrId,
            "stackNo": self.stackNo,
            "instrcode": self.instrcode,
            "sampleRate": self.sampleRate,
            "type": self.type,
            "style": self.style,
            "discipline": self.discipline,
            "startDate": self.startDate.isoformat() if self.startDate else None,
            "endDate": self.endDate.isoformat() if self.endDate else None,
            "instrProject": self.instrProject,
            "dcunitCode": self.dcunitCode,
            "illeagle": self.illeagle,
            "registerFlag": self.registerFlag,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }