import { app, Menu, MenuItemConstructorOptions, shell } from "electron";

export function setupApplicationMenu(userDataDir: string): void {
  const isMac = process.platform === "darwin";

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const, label: `Acerca de ${app.name}` },
              { type: "separator" as const },
              {
                label: "Abrir carpeta de datos...",
                click: () => {
                  shell.openPath(userDataDir);
                },
              },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const, label: `Ocultar ${app.name}` },
              { role: "hideOthers" as const, label: "Ocultar otros" },
              { role: "unhide" as const, label: "Mostrar todo" },
              { type: "separator" as const },
              { role: "quit" as const, label: `Salir de ${app.name}` },
            ],
          },
        ]
      : []),
    {
      label: "Archivo",
      submenu: [
        {
          label: "Abrir carpeta de datos...",
          click: () => {
            shell.openPath(userDataDir);
          },
        },
        { type: "separator" as const },
        isMac ? { role: "close" as const, label: "Cerrar ventana" } : { role: "quit" as const, label: "Salir" },
      ],
    },
    {
      label: "Edición",
      submenu: [
        { role: "undo" as const, label: "Deshacer" },
        { role: "redo" as const, label: "Rehacer" },
        { type: "separator" as const },
        { role: "cut" as const, label: "Cortar" },
        { role: "copy" as const, label: "Copiar" },
        { role: "paste" as const, label: "Pegar" },
        { role: "selectAll" as const, label: "Seleccionar todo" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { role: "reload" as const, label: "Recargar" },
        { role: "forceReload" as const, label: "Forzar recarga" },
        { role: "toggleDevTools" as const, label: "Herramientas de desarrollo" },
        { type: "separator" as const },
        { role: "resetZoom" as const, label: "Tamaño real" },
        { role: "zoomIn" as const, label: "Acercar" },
        { role: "zoomOut" as const, label: "Alejar" },
        { type: "separator" as const },
        { role: "togglefullscreen" as const, label: "Pantalla completa" },
      ],
    },
    {
      label: "Ventana",
      submenu: [
        { role: "minimize" as const, label: "Minimizar" },
        { role: "zoom" as const, label: "Maximizar" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const, label: "Traer todo al frente" },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const, label: "Cerrar" }]),
      ],
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Buscar actualizaciones...",
          click: async () => {
            const { checkForUpdatesManual } = await import("./updater");
            await checkForUpdatesManual();
          },
        },
        { type: "separator" as const },
        {
          label: "Documentación de Fiscalio",
          click: () => {
            shell.openExternal("https://github.com/EzeRangel/fiscalio-app");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
