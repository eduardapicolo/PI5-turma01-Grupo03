from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
def get_database():
    # Cria a conexão com o Cluster
    client = MongoClient(mongo_uri)
    
    return client['PetMatch']

if __name__ == "__main__":
    # Teste de conexão
    db = get_database()
    print("Conectado ao banco:", db.name)