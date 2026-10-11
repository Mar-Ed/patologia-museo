# Configurar los comentarios en Supabase

## Estado actual

La conexión y la cuenta administradora confirmada se comprobaron mediante consultas de lectura. Después de ejecutar el SQL, `list_museum_comments` respondió correctamente en el proyecto remoto. El código local incluye acceso, recuperación de contraseña, panel y comentarios. No se ha desplegado la web ni se han creado comentarios de prueba en Supabase.

## Revisar en local

Desde `museo-patologia-limpio`, ejecutar `npm run dev` y abrir `http://localhost:3000/admin/login`. Entrar con el correo y la contraseña creados en Supabase. No es necesario compartir la contraseña. Si Next.js elige otro puerto, usar la dirección que muestre la terminal.

El panel permite aprobar, rechazar, devolver a pendientes y responder; incluye filtros por ficha, búsqueda en el texto y paginación. Los comentarios aparecen debajo de la ficha científica. El formulario público se muestra directamente. El botón de envío se habilita cuando termina la primera consulta y se prepara la cookie del visitante.

## Paso 1: desactivar el registro público

En Supabase, abrir **Authentication → Sign In / Providers**, desactivar **Allow new users to sign up** y guardar. La última comprobación encontró el registro público habilitado. Esto conserva el acceso de la cuenta administradora existente.

## Paso 2: crear la base para comentarios

1. Abrir **SQL Editor → New query** en el proyecto correcto.
2. Copiar el contenido completo de `supabase/migrations/202610100001_museum_comments.sql`.
3. Pegarlo en el editor y pulsar **Run**.
4. Esperar el mensaje de éxito. Si aparece un error, conservar su texto para revisarlo antes de continuar.

El archivo verifica el identificador y el correo confirmado del administrador antes de crear la configuración. Prepara comentarios pendientes, aprobados y rechazados, una respuesta oficial y funciones de moderación. La consulta pública solo devuelve campos publicables de comentarios aprobados. El correo opcional y los motivos de rechazo permanecen privados.

Los envíos y controles de frecuencia requieren el servidor de la web. La clave secreta solo se usará en el servidor, en una variable sin el prefijo `NEXT_PUBLIC_`.

## Paso 3: revisar el formulario propio

### Actualización: Me gusta y respuestas

Ejecutar **una vez** el archivo completo `supabase/migrations/202610110002_comment_threads.sql` en **SQL Editor → New query → Run**, después del SQL inicial. Esta ampliación conserva los comentarios y añade respuestas y reacciones. No es necesario volver a ejecutar el SQL inicial. Después, recargar la ficha.

Hasta aplicar esta ampliación, se mantienen la lectura y el envío de comentarios principales; los botones de Me gusta y Responder aparecen deshabilitados. La aplicación no convierte una respuesta fallida en un comentario independiente.

Los visitantes pueden dar o quitar Me gusta a comentarios y respuestas aprobados. Hay un registro por cookie de navegador, no una identidad personal verificada; borrar cookies o usar otro navegador cambia la identidad anónima. Las respuestas se agrupan a un nivel bajo el comentario original y pasan por la misma bandeja de moderación. El panel muestra a quién se responde y el comentario original. Al retirar el original, sus respuestas también quedan ocultas; su contenido se conserva.

Prueba adicional: dar Me gusta, recargar y quitarlo; verificar que un doble clic no suma votos adicionales. Enviar una respuesta, aprobarla desde el panel y desplegarla bajo su comentario original. Retirar el original y comprobar que el hilo deja de mostrarse.

Por decisión del usuario, el formulario no utiliza Cloudflare ni un CAPTCHA externo. Funciona con la configuración existente de Supabase. Conserva aprobación manual, un campo invisible para detectar envíos automatizados, validación del servidor y límites de frecuencia. Cada envío se guarda como pendiente.

Los límites se almacenan en PostgreSQL para funcionar entre instancias. La IP procede del encabezado sobrescrito por Vercel; en local y otros proveedores se utiliza un límite de red compartido conservador. Antes de cambiar de proveedor, revisar su fuente fiable de IP. Los identificadores se guardan como HMAC, sin direcciones IP en texto.

## Paso 4: recuperación por correo

En **Authentication → URL Configuration**, configurar Site URL como `https://www.museopatologiaveterinaria.com` y añadir a Redirect URLs:

- `http://localhost:3000/auth/callback` para revisar en local.
- `https://www.museopatologiaveterinaria.com/auth/callback` para producción.

Si se usa otro puerto local, añadir su URL exacta. Conservar `{{ .ConfirmationURL }}` en la plantilla Reset Password: esta integración utiliza el código PKCE que devuelve Supabase. Solicitar y abrir el enlace en el mismo navegador. Los enlaces vencidos, usados o abiertos sin el verificador vuelven a la pantalla de recuperación.

Configurar SMTP en Supabase para la entrega real. El envío predeterminado tiene restricciones; verificar la recepción de un correo real antes de dar por probada la recuperación. La respuesta de la web es genérica, incluso si el proveedor rechaza el envío, para no revelar la existencia de cuentas.

Documentación: https://supabase.com/docs/guides/auth/auth-smtp y https://supabase.com/docs/guides/auth/server-side/creating-a-client

## Despliegue

Mantener las tres variables Supabase ya configuradas en el hosting. `SUPABASE_SECRET_KEY` es exclusiva del servidor; nunca debe llevar el prefijo `NEXT_PUBLIC_`. `.env.local` está ignorado por Git.

La web permite mutaciones desde el dominio canónico y desde el origen local durante `npm run dev`. Si se necesita otro dominio de producción, configurar `APP_ORIGIN` con su origen HTTPS exacto y añadirlo a las URLs de retorno de Supabase.

## Revisión manual acordada

El usuario revisará en `npm run dev`. Antes de activar en producción:

1. Abrir `/admin` sin sesión: debe llevar al login. Comprobar login incorrecto y correcto.
2. Enviar un comentario ficticio desde una ventana privada: debe confirmar revisión y permanecer invisible públicamente.
3. Aprobarlo: debe aparecer al recargar la ficha, sin correo privado. Añadir y editar la respuesta oficial.
4. Retirarlo a pendientes y rechazarlo: el comentario y su respuesta deben desaparecer públicamente. Volver a pendientes para reconsiderarlo.
5. Abrir el mismo comentario en dos pestañas: una versión desactualizada debe exigir actualizar antes de modificarlo.
6. Probar un error de red al enviar: el texto debe conservarse; reintentar el mismo envío no debe duplicarlo.
7. Probar la entrega real del correo, el enlace de recuperación y el cambio de contraseña. Después del logout, `/admin` y sus endpoints no deben entregar datos privados.
8. Revisar en móvil y con teclado. Los comentarios se muestran como texto, sin interpretar HTML.

## Comprobaciones locales

- `npm run test:comments:database`: prueba permisos y transiciones en una base temporal; no modifica Supabase.
- `npm run test:comments:api`: verifica formulario propio, envío sin CAPTCHA, campo invisible, origen, tamaño, validación, cookies, límites, autorización y recuperación con servicios simulados; no envía correos.
- `npm run check:supabase`: consultas remotas de lectura sobre cuenta, registro público y disponibilidad de la función pública; no muestra claves ni verifica todo el esquema remoto.
- `npm run lint`, `npm run build` y `npm run test:seo`: validación del código y de la salida compilada.

La prueba preexistente `test:performance` falla en `check-catalog-interactions.mjs:60`: espera 8 fichas de categoría adquirida, pero los datos actuales contienen 5. Ese código de catálogo y su prueba no se modificaron en esta implementación.

## Mantenimiento

La configuración privada del administrador admite una sola cuenta. No eliminar ese usuario de Supabase sin preparar su sustitución mediante mantenimiento SQL.

Si Supabase pausa el proyecto por inactividad, reactivarlo desde su dashboard. Exportar regularmente `museum_comments` desde un entorno de confianza y guardar la copia en un lugar privado: incluye correos opcionales y motivos internos.
