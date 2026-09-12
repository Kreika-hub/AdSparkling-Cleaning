# Ad Sparkling Cleaning - Variables de Entorno (Fase 1)

Para que el sistema de funciones serverless funcione correctamente en producción, debes configurar las siguientes variables de entorno en Vercel (Project Settings > Environment Variables):

## Variables Requeridas

*   `SUPABASE_URL`: La URL de tu proyecto de Supabase (ej. `https://xxxx.supabase.co`).
*   `SUPABASE_SERVICE_ROLE_KEY`: La clave **Service Role** de Supabase (la puedes encontrar en Project Settings > API). **¡IMPORTANTE!** Esta clave NO es la anon key. Tiene acceso total a la base de datos saltándose RLS. Por diseño de seguridad, **NUNCA** debe comenzar con `NEXT_PUBLIC_` ni enviarse al cliente de ninguna manera. Solo debe usarse en las funciones de `/api/`.
*   `ADMIN_PASSWORD`: La contraseña maestra para acceder al panel de administración (ej. `Anggie2026`). 
*   `ADMIN_SECRET`: Una cadena de texto secreta aleatoria (ej. `mi_secreto_largo_y_seguro_12345`) usada para firmar criptográficamente los tokens de sesión.

## Notas de Seguridad

*   Con esta configuración (Fase 1), todo el acceso a base de datos de administración y cliente se realiza desde el servidor seguro (Vercel Functions) utilizando la clave de administrador.
*   El navegador del cliente ya no se comunica de manera directa ni expone permisos altos.
