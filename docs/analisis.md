# Análisis del sistema de puntuación de Catán

## Objetivo

La aplicación permite llevar el puntaje de una única partida activa y mostrarlo en dos módulos:

- **Administrador (/admin)**: alta y baja de participantes y edición de contadores.
- **Panel (/)**: matriz de resultados pensada para permanecer visible durante la partida.

Ambos módulos usan la misma base de datos. El panel consulta cambios cada dos segundos, por lo que puede abrirse en otro teléfono, computadora o televisor.

## Alcance funcional

Cada partida admite hasta seis participantes y cada color sólo puede usarse una vez: rojo, azul, verde, amarillo, marrón y hueso.

El administrador ofrece botones − y +, además de ingreso numérico directo, para poblados, ciudades, caminos, ejércitos y puntos adicionales. Los valores permitidos están entre 0 y 99.

## Reglas de puntuación

El total se calcula así:

    total =
      poblados
      + (ciudades × 2)
      + puntos adicionales
      + (camino más largo ? 2 : 0)
      + (ejército más grande ? 2 : 0)

La cantidad de caminos se muestra, pero no suma puntos por sí misma. Sólo otorga 2 puntos al jugador que posee el camino más largo, una vez alcanzado el mínimo de 5 caminos.

La cantidad de ejércitos se muestra, pero no suma puntos por sí misma. Sólo otorga 2 puntos cuando el jugador posee el ejército más grande.

### Camino más largo

- Se habilita al alcanzar 5 caminos.
- Lo recibe quien tenga la mayor cantidad.
- Ante un empate, lo conserva o recibe quien primero alcanzó exactamente esa cantidad.

### Ejército más grande

- Se habilita al alcanzar 3 ejércitos.
- Lo recibe quien tenga la mayor cantidad.
- Ante un empate, lo conserva o recibe quien primero alcanzó exactamente esa cantidad.

Para resolver el desempate de manera determinista, se guarda un hito por cada cantidad de caminos o ejércitos alcanzada. Esto también funciona cuando el administrador ingresa un número directamente.

## Arquitectura

- Interfaz React con rutas de servidor compatibles con Cloudflare Workers.
- API interna en POST /api/game y GET /api/game.
- Persistencia en Cloudflare D1 (SQLite administrado).
- Migraciones de esquema generadas con Drizzle.
- Consulta periódica desde el panel cada dos segundos.
- Herramientas WebMCP en el administrador para consultar el estado y actualizar un contador desde clientes compatibles.

La base tiene tres tablas:

1. games: partida activa y secuencia global de eventos.
2. players: participantes, colores y contadores actuales.
3. score_milestones: orden en que cada participante alcanzó cada cantidad relevante para desempates.

## Decisiones y supuestos

- El panel principal ocupa la ruta /; así un enlace corto abre directamente el marcador.
- La administración está protegida por un PIN numérico de 8 dígitos configurado como secreto del entorno, nunca en el código fuente.
- La sesión usa una cookie firmada, HttpOnly, SameSite Strict y con una duración de 12 horas.
- Los intentos fallidos se limitan a cinco por dirección en una ventana de 15 minutos.
- El servidor protege tanto la ruta /admin como todas las operaciones que modifican puntajes; ocultar solamente la interfaz no se considera una protección suficiente.
- El alcance actual administra una partida activa. No incluye historial ni múltiples salas simultáneas.
- Se usan iconos con nombre accesible en el encabezado de la matriz, evitando depender sólo de la forma visual.

## Publicación gratuita recomendada

La opción recomendada es **Cloudflare Workers + D1**. La aplicación ya está diseñada para ese entorno y no necesita contratar una base de datos separada.

Según la documentación oficial consultada el 12 de septiembre de 2026, el plan gratuito de Workers incluye capacidad para aplicaciones pequeñas y D1 ofrece 5 millones de filas leídas por día, 100.000 filas escritas por día y 5 GB totales de almacenamiento. Es muy superior a lo necesario para un marcador doméstico:

- [Precios de Cloudflare Workers](https://developers.cloudflare.com/workers/platform/pricing/)
- [Precios de Cloudflare D1](https://developers.cloudflare.com/d1/platform/pricing/)
- [Límites de Cloudflare D1](https://developers.cloudflare.com/d1/platform/limits/)

**Vercel Hobby** es una alternativa válida para proyectos personales y ofrece funciones gratuitas dentro de sus límites, pero este proyecto requeriría adaptar la persistencia a otro proveedor de base de datos:

- [Plan Hobby de Vercel](https://vercel.com/docs/plans/hobby)

## Ejecución en la red local

La misma aplicación puede ejecutarse en el equipo del administrador y abrirse desde otros dispositivos conectados a la misma red Wi-Fi o Ethernet.

1. Ejecutar npm run dev:lan.
2. En el equipo anfitrión, abrir http://localhost:3000.
3. En los demás dispositivos, abrir http://IP-DEL-EQUIPO:3000.

El proceso debe permanecer abierto durante la partida. La base local se conserva en la carpeta de estado de Wrangler. En Windows, si aparece una consulta del firewall, se debe permitir Node.js sólo en redes privadas.

Los secretos del administrador se leen desde el archivo local .env al iniciar el proceso y no se incorporan al paquete compilado.

## Evolución sugerida

Para una segunda versión:

1. permitir el cambio del PIN desde una sección segura;
2. crear códigos de partida para ejecutar varias mesas en paralelo;
3. añadir historial y cierre de partida;
4. sustituir el sondeo por Server-Sent Events si se necesita actualización instantánea con muchas pantallas.
