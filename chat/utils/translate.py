import os
from dotenv import load_dotenv
from google.cloud import translate_v2 as translate

# Загружаем .env
load_dotenv()

# Получаем путь из переменной
credential_path = os.getenv("GOOGLE_KEY_PATH")

if not credential_path:
    raise RuntimeError("GOOGLE_KEY_PATH не установлен в .env!")

# Устанавливаем системную переменную (обязательно для клиента Google)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credential_path

# Инициализация клиента
translate_client = translate.Client()

def translate_message(text, target_language='en'):
    result = translate_client.translate(text, target_language=target_language)
    return result['translatedText']