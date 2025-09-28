from flask_sqlalchemy import SQLAlchemy

from app import db

class DzmlNew(db.Model):
    __tablename__ = "dzml_new"

    # 主键字段（联合主键）
    year = db.Column(db.Integer, primary_key=True)
    month = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Integer, primary_key=True)
    hour = db.Column(db.Integer, primary_key=True)
    min = db.Column(db.Integer, primary_key=True)
    sec = db.Column(db.Numeric(20, 3), primary_key=True)
    lon = db.Column(db.Numeric(20, 3), primary_key=True)
    lat = db.Column(db.Numeric(20, 3), primary_key=True)
    depth = db.Column(db.Integer, primary_key=True)
    mc = db.Column(db.Numeric(20, 1), primary_key=True)

    # 其他字段
    JingDu = db.Column(db.String(20))
    WeiDu = db.Column(db.String(20))
    DiMing = db.Column(db.String(200))
    ZhenJiZhi = db.Column(db.Numeric(20, 1))
    ShenDu = db.Column(db.Integer)
    RiQi = db.Column(db.DateTime)
    years = db.Column(db.String(20))
    ZhenJiLeiXing = db.Column(db.String(20))
    mag1 = db.Column(db.String(20))
    DiZhenLeiXing = db.Column(db.String(20))
    WeiHao = db.Column(db.Integer)
    tag = db.Column(db.Integer)
    Notes = db.Column(db.String(20))
    OldId = db.Column(db.String(100))
    UpgradeTime = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "year": self.year,
            "month": self.month,
            "day": self.day,
            "hour": self.hour,
            "min": self.min,
            "sec": float(self.sec),
            "lon": float(self.lon),
            "lat": float(self.lat),
            "depth": self.depth,
            "mc": float(self.mc),
            "JingDu": self.JingDu,
            "WeiDu": self.WeiDu,
            "DiMing": self.DiMing,
            "ZhenJiZhi": float(self.ZhenJiZhi) if self.ZhenJiZhi else None,
            "ShenDu": self.ShenDu,
            "RiQi": self.RiQi.isoformat() if self.RiQi else None,
            "years": self.years,
            "ZhenJiLeiXing": self.ZhenJiLeiXing,
            "mag1": self.mag1,
            "DiZhenLeiXing": self.DiZhenLeiXing,
            "WeiHao": self.WeiHao,
            "tag": self.tag,
            "Notes": self.Notes,
            "OldId": self.OldId,
            "UpgradeTime": self.UpgradeTime.isoformat() if self.UpgradeTime else None,
        }
