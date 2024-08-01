import sqlite3

def clear_fog_data(db_path):
    try:
        # Połączenie z bazą danych SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Usunięcie wszystkich rekordów z tabeli fog
        cursor.execute("DELETE FROM fog")

        # Zatwierdzenie zmian
        conn.commit()

        print("Wszystkie dane mgły wojny zostały usunięte.")
    except sqlite3.Error as e:
        print(f"Błąd podczas usuwania danych mgły wojny: {e}")
    finally:
        # Zamknięcie połączenia z bazą danych
        if conn:
            conn.close()

# Ścieżka do bazy danych
db_path = 'markers.db'

# Wywołanie funkcji do usunięcia danych mgły wojny
clear_fog_data(db_path)
