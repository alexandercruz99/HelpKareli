# crear_admin.py
#requisitos pip install bcrypt mysql-connector-python
import bcrypt
import mysql.connector
from mysql.connector import Error

def crear_administrador():
    try:
        # Configuración de la base de datos
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='loquesea2013',  # Tu password de MySQL
            database='SpeakLexi2'
        )
        
        if connection.is_connected():
            print("🔧 Conectado a la base de datos...")
            
            cursor = connection.cursor()
            
            email = "admin@speaklexi.com"
            password = "Admin123!"
            
            # 1. Eliminar admin existente
            print("🗑️  Eliminando admin anterior...")
            cursor.execute("DELETE FROM perfil_administradores WHERE usuario_id IN (SELECT id FROM usuarios WHERE correo = %s)", (email,))
            cursor.execute("DELETE FROM perfil_usuarios WHERE usuario_id IN (SELECT id FROM usuarios WHERE correo = %s)", (email,))
            cursor.execute("DELETE FROM usuarios WHERE correo = %s", (email,))
            
            # 2. Generar hash de la contraseña
            print("🔐 Generando hash...")
            salt = bcrypt.gensalt(rounds=12)
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
            
            print(f"📝 Hash generado: {password_hash.decode('utf-8')[:30]}...")
            
            # 3. Insertar nuevo usuario
            print("👤 Creando usuario...")
            cursor.execute("""
                INSERT INTO usuarios 
                (nombre, primer_apellido, segundo_apellido, correo, contrasena_hash, rol, 
                 estado_cuenta, correo_verificado, ultimo_acceso) 
                VALUES (%s, %s, %s, %s, %s, %s, 'activo', TRUE, NOW())
            """, (
                "Carlos", 
                "Administrador", 
                "Principal", 
                email, 
                password_hash.decode('utf-8'), 
                "admin"
            ))
            
            user_id = cursor.lastrowid
            print(f"✅ Usuario creado con ID: {user_id}")
            
            # 4. Crear perfil base
            cursor.execute("""
                INSERT INTO perfil_usuarios (usuario_id, nombre_completo, telefono) 
                VALUES (%s, %s, %s)
            """, (user_id, "Carlos Administrador Principal", "+34 612 345 678"))
            print("✅ Perfil base creado")
            
            # 5. Crear perfil de administrador
            cursor.execute("""
                INSERT INTO perfil_administradores (usuario_id, departamento, nivel_acceso, cargo) 
                VALUES (%s, %s, %s, %s)
            """, (user_id, "Desarrollo y Operaciones", "super_admin", "Administrador Principal del Sistema"))
            print("✅ Perfil de administrador creado")
            
            # 6. Confirmar cambios
            connection.commit()
            
            # 7. Verificar el hash
            is_valid = bcrypt.checkpw(password.encode('utf-8'), password_hash)
            verification_status = "✅ VÁLIDO" if is_valid else "❌ INVÁLIDO"
            
            print("\n" + "="*50)
            print("✅✅✅ ADMINISTRADOR CREADO EXITOSAMENTE ✅✅✅")
            print("="*50)
            print(f"📧 Correo: {email}")
            print(f"🔑 Contraseña: {password}")
            print(f"👤 Rol: admin")
            print(f"🔐 Verificación hash: {verification_status}")
            print("="*50)
            
    except Error as e:
        print(f"❌ Error: {e}")
        if connection.is_connected():
            connection.rollback()
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("🔒 Conexión cerrada")

if __name__ == "__main__":
    crear_administrador()