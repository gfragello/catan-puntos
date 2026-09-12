# Ejecución local

Abrir PowerShell y ejecutar:

```powershell
cd C:\Users\guill\workspace\catan-puntos
npm.cmd run dev:lan
```

Una vez iniciado, la aplicación queda disponible en:

- En este equipo: `http://localhost:3000`
- Panel de administración: `http://localhost:3000/admin`
- En otros dispositivos de la misma red: `http://IP-DEL-EQUIPO:3000`

Para conocer la dirección IP del equipo, ejecutar:

```powershell
ipconfig
```

Buscar la dirección **IPv4** del adaptador de red que esté conectado y reemplazar
`IP-DEL-EQUIPO` por ese valor. Por ejemplo: `http://192.168.1.12:3000`.

Si Windows solicita permiso para que Node.js acceda a la red, habilitar el acceso
para redes privadas.

## Detener la aplicación

Volver a la ventana de PowerShell donde se está ejecutando y presionar
`Ctrl+C`. Si aparece `Terminate batch job (Y/N)?`, escribir `Y` y presionar Enter.
