from database import get_database

db = get_database()

cats_col = db['cats']
dogs_col = db['dogs']
users_col = db['users']
interactions_col = db['interactions']
pets_col = db['pets']

#users teste para ver se esta funcionando a conexão
def cadastrar_usuario(nome, preferencia, localizacao):
    novo_usuario = {
        "nome": nome,
        "preferencia": preferencia,
        "localizacao": localizacao
    }
    return users_col.insert_one(novo_usuario).inserted_id