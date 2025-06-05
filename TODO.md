# Registro de usuarios en la aplicación.

- Cada usuario que quiera interactuar con la aplicación debe registrarse vía el formulario de registro.
- El registro se realiza a través de un formulario que solicita el nombre, correo electrónico y contraseña del usuario.
- Al enviar el formulario, se envía un correo electrónico de confirmación al usuario con un enlace para activar su cuenta.
- El enlace de activación contiene un token único que se verifica al hacer clic en él.
- Una vez que el usuario activa su cuenta, se le redirige a la página de inicio de sesión.
- Una vez que el usuario se haya registrado y activado su cuenta, el sistema lo dará de alta en la whitelist de Exchange Online para que pueda enviar correos electrónicos a la dirección de correo electrónico de la aplicación.
- La aplicación debe actualizar de alguna manera el script de registro de contactos de Exchange Online para incluir al nuevo usuario.
  - Puede usar una viable en el script para obtener todos los usuarios registrados y luego agregar el nuevo usuario a la lista.
  - El script de registro de contactos de Exchange Online debe ejecutarse cada vez que un usuario nuevo se da de alta en la aplicación.
  - Actualmente el script registra todos los contactos en la whitelist cada vez que se ejecuta, por lo que es **necesario optimizarlo para que solo agregue a los nuevos usuarios**.
