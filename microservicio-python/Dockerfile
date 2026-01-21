# Usamos una imagen ligera de Python
FROM python:3.9-slim

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el archivo de requerimientos e instalamos las librerías
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el resto del código (app.py, modelos, etc.) al contenedor
COPY . .

# Le decimos a Docker que este contenedor usará el puerto 5000
EXPOSE 5000

# El comando para arrancar tu aplicación cuando se inicie el contenedor
CMD ["python", "app.py"]