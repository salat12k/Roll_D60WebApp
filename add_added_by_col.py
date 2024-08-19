from app import db, app

def add_added_by_column():
    with app.app_context():
        with db.engine.connect() as connection:
            connection.execute(db.text('ALTER TABLE marker ADD COLUMN added_by VARCHAR(50)'))

if __name__ == "__main__":
    add_added_by_column()
    print("Column added_by added to marker table.")
