**Plan simplificado: comentarios y un solo administrador**

Fecha: 10 de octubre de 2026. Proyecto: `C:/Users/marce/Desktop/proyecto_nero/museo-patologia-limpio`. Estado actualizado: acceso, recuperación, panel y comentarios implementados localmente. La consulta pública de Supabase ya responde. Quedan el cierre del registro público, los ajustes de correo y la revisión manual del usuario antes de publicar. Ver `docs/configurar-comentarios-supabase.md`. Esta versión sustituye el plan anterior.

**1. Qué tendrá la web**

Los visitantes podrán comentar sin cuenta. Una única cuenta administradora entrará con correo y contraseña para aprobar, rechazar y responder comentarios. La cuenta se creará una sola vez desde Supabase; la web no tendrá registro, invitaciones ni gestión de otros usuarios.

| Parte | Funcionamiento |
|---|---|
| Comentarios públicos | Debajo de las pestañas de cada ficha de patología. |
| Formulario | Nombre o seudónimo, comentario y correo opcional privado. |
| Publicación | Solo se muestran comentarios aprobados. |
| Administración | Una bandeja con pendientes, aprobados y rechazados. |
| Acceso | Una cuenta, correo y contraseña, recuperación y cierre de sesión. |
| Respuestas | Una respuesta oficial por comentario, editable por el administrador. |

**2. Flujo de comentarios**

Ampliación solicitada: presentación tipo blog con Me gusta y respuestas de visitantes. Los Me gusta se pueden activar o quitar y se cuentan una vez por navegador mediante cookie firmada; no requieren aprobación. Las respuestas se muestran a un nivel bajo el comentario original después de aprobarlas. El panel incluye el contexto del comentario al que responden. Si se retira el original, sus respuestas dejan de mostrarse. Esta ampliación requiere ejecutar `supabase/migrations/202610110002_comment_threads.sql` después de la migración inicial; conserva los datos existentes.

1. El visitante completa el formulario y envía su comentario.
2. El servidor valida los datos y lo guarda como pendiente.
3. La web confirma: «Tu comentario fue enviado para revisión».
4. El administrador inicia sesión y abre la bandeja de pendientes.
5. Al aprobarlo, el comentario aparece en esa ficha en la siguiente consulta. Al rechazarlo, permanece privado.
6. El administrador puede responder, retirar un comentario publicado devolviéndolo a pendiente o reconsiderar uno rechazado.

| Estado | ¿Se muestra? | Acciones del administrador |
|---|---|---|
| Pendiente | No | Aprobar o rechazar. |
| Aprobado | Sí | Responder o retirar a pendiente. |
| Rechazado | No | Volver a pendiente para revisarlo. |

Rechazar no borra el comentario. Se puede registrar un motivo interno, que no verá el público. Si se retira un comentario, su respuesta también deja de mostrarse. El texto original del visitante no se edita desde el panel. Cada comentario conserva la fecha de su última revisión; no se necesita una pantalla de auditoría independiente.

El listado público tendrá paginación de diez comentarios. Un envío fallido conservará el texto en el formulario; solo se mostrará confirmación cuando el guardado haya terminado. Se impedirá el doble envío y se controlarán los reintentos para no duplicar comentarios. No se enviarán avisos automáticos a comentaristas en esta primera versión; el correo opcional será exclusivamente de contacto.

**3. Pantallas necesarias**

| Ruta | Contenido |
|---|---|
| `/admin/login` | Correo, contraseña, mostrar contraseña y enlace de recuperación. |
| `/admin/recuperar` | Solicitud de recuperación con mensaje genérico. |
| `/admin/restablecer` | Nueva contraseña después de verificar el enlace. |
| `/admin` | Lista de comentarios con filtros de estado y patología, búsqueda y botón de cerrar sesión. |

Al abrir un comentario en la misma bandeja se muestran texto completo, autor, ficha relacionada, fecha, correo privado si existe y acciones de aprobar/rechazar/responder. No hace falta un dashboard separado ni navegación de gestión de usuarios.

Se reutilizarán el estilo y los componentes del museo. Los formularios tendrán etiquetas visibles, acceso por teclado, errores claros y botones con estado de envío. El login permitirá autocompletar, pegar contraseñas y usar gestores. La integración aprovechará el layout existente, sin una reorganización general de todas las páginas.

**4. Supabase y datos**

Se utilizará Supabase Auth para la cuenta y Postgres para los comentarios. Se desactivará el registro público y no se crearán usuarios Auth para los visitantes.

| Datos | Contenido |
|---|---|
| Cuenta en Supabase Auth | Único administrador, con correo y contraseña gestionados por Supabase. |
| Configuración privada del administrador | Una sola fila con el UUID exacto de esa cuenta; una restricción impide añadir una segunda fila. |
| Tabla `comments` | ID, slug de la patología, nombre o alias, texto, correo opcional, estado, fechas, motivo interno de rechazo y respuesta del administrador. |

La configuración privada será la fuente del identificador autorizado tanto para servidor como para permisos de datos. No se confiará únicamente en estar autenticado ni en un campo enviado por el navegador. Cambiar la cuenta autorizada será una operación de mantenimiento desde Supabase.

La tabla de comentarios no tendrá lectura directa pública. El listado se obtendrá mediante una función o proyección explícita que devuelva únicamente aprobados y campos públicos. Nunca incluirá correo ni motivos internos. El administrador tendrá acceso mediante su sesión y políticas RLS que comprueben su UUID.

La inserción pública pasará por el servidor de Next.js. Este validará los datos y creará exclusivamente comentarios pendientes; ninguna petición podrá asignar su propio estado. Las claves privilegiadas, si se necesitan para este envío, estarán aisladas en código de servidor. Las operaciones administrativas utilizarán la sesión del administrador y sus permisos.

No se trasladarán a Supabase las fichas, fotografías o videos del museo. Las fichas se podrán compilar y leer aunque la base de comentarios esté temporalmente indisponible.

**5. Seguridad básica necesaria**

- Verificar la sesión con Supabase en cada página y operación privada, y comprobar que pertenece a la única cuenta autorizada. Ocultar botones no sustituye esta validación.
- Aplicar RLS y privilegios SQL: el público no puede leer pendientes o correos, aprobar comentarios ni modificar la cuenta autorizada. Las funciones públicas solo exponen los campos previstos.
- Usar la integración oficial de sesiones de Supabase para Next.js, sin crear un sistema propio de sesiones. Combinar la renovación con el `proxy.ts` existente y preservar sus redirecciones y bloqueos. Las respuestas privadas no se almacenan en caché compartida.
- Procesar el login con Supabase Auth. No guardar contraseñas en tablas propias ni en logs. Usar una contraseña larga y única y mensajes de acceso/recuperación que no revelen si una cuenta existe.
- Recuperar la contraseña mediante un enlace válido, con vencimiento y destino permitido. Cerrar sesión usando Supabase y limpiar las cookies correspondientes. Respetar el comportamiento de vencimiento y revocación de sus tokens.
- Mantener las claves secretas fuera del navegador, de Git y de los logs. Las variables de ejemplo no incluirán credenciales reales.
- Validar nombre, longitud del texto, correo opcional y existencia de la patología en el servidor. Presentar los comentarios como texto escapado tanto en la web como en el panel.
- Proteger las mutaciones administrativas contra CSRF mediante verificación de origen y protección ligada a la sesión. No realizar cambios mediante GET.
- Limitar envíos repetidos y validar un campo invisible para detectar algunos envíos automatizados. Por decisión del usuario, no se requiere CAPTCHA externo. Los límites deben funcionar entre distintas instancias del hosting y contar con limpieza de registros temporales.
- Evitar indexar `/admin` y las pantallas de acceso. Su protección real seguirá siendo la autorización de servidor y base de datos.

El alta pública puede desactivarse en [Supabase Auth](https://supabase.com/docs/guides/auth/general-configuration). La integración seguirá la documentación de [sesiones con Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client) y [permisos RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

**6. Orden de implementación**

| Paso | Entregable |
|---|---|
| 1. Preparar Supabase | Proyecto, cuenta única, tabla de comentarios, configuración privada, migraciones y permisos. |
| 2. Implementar acceso | Login, recuperación, restablecimiento, logout y protección de `/admin`. |
| 3. Implementar comentarios | Formulario y listado por patología, validación, paginación y control de abuso. |
| 4. Implementar bandeja | Pendientes/aprobados/rechazados, filtros y acciones de revisión y respuesta. |
| 5. Probar y publicar | Validar el ciclo completo y los permisos con datos ficticios antes de activar envíos públicos. |

Los cambios principales afectarán a la ficha de patología, nuevos componentes de comentarios, rutas `/admin`, endpoints públicos y administrativos, utilidades Supabase y migraciones SQL. Se revisarán el proxy, los metadatos privados y el comportamiento de caché sin rediseñar la estructura general de la web.

**7. Comprobaciones antes de activar**

| Prueba | Resultado esperado |
|---|---|
| Envío sin login | Se guarda pendiente y se confirma una sola vez. |
| Aprobar, rechazar, responder y retirar | El listado público refleja cada cambio al consultarlo de nuevo. |
| Visitante consulta API o Supabase directamente | No obtiene pendientes, correos ni capacidad de modificar datos. |
| Cuenta distinta de la autorizada | No puede entrar ni operar como administrador. |
| Petición intenta enviar `status=approved` | No puede saltarse la revisión. |
| Login incorrecto o enlace de recuperación inválido | No concede acceso ni revela información de la cuenta. |
| Comentario con HTML, doble clic o exceso de envíos | El contenido se muestra como texto; no se duplica ni se evita el límite. |
| Sesión cerrada, petición desde otro sitio y respuesta privada en caché | No se accede al panel sin autorización ni se comparten datos privados. |
| Supabase no disponible | La ficha sigue accesible y el formulario muestra un error recuperable. |

Se ejecutarán pruebas de permisos contra una base de desarrollo y del flujo completo en navegador, además de lint, build y las comprobaciones existentes de las áreas afectadas. Solo se añadirá lo necesario para verificar el acceso privado, la publicación y la protección de datos.

Para empezar harán falta el proyecto Supabase, el correo de la única cuenta administradora y las credenciales configuradas como secretos. La recuperación real por correo requiere configurar SMTP: el envío predeterminado de Supabase está pensado para pruebas. [Documentación SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

El plan gratuito puede pausarse por inactividad y no incluye copias automáticas de la base. Se documentará cómo reactivarlo y exportar los comentarios como respaldo. [Condiciones de Supabase Free](https://supabase.com/pricing).
