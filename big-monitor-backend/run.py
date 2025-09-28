from app import create_app, db
from sqlalchemy import text  # ✅ 新增

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))  # 使用 text() 包装
            print("✅ 数据库连接成功！")
        except Exception as e:
            print("❌ 数据库连接失败：", e)
    app.run(debug=True)
