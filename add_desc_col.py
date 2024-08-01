from app import app, db

def add_description_column():
    with app.app_context():
        with db.engine.connect() as connection:
            connection.execute('ALTER TABLE marker ADD COLUMN description STRING')

if __name__ == '__main__':
    add_description_column()
