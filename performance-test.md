# 🚀 Test de Rendimiento VS Code

## Estado Actual
- Fecha: ${new Date().toISOString()}
- Proyecto: Fumigación Certificado App
- Archivos en workspace: ~50

## Extensiones Sospechosas de Lentitud

### Paso 1: Medir tiempo de inicio
1. Cierra VS Code completamente
2. Abre Task Manager (Ctrl+Shift+Esc)
3. Abre VS Code y mide tiempo hasta que esté completamente cargado
4. Anota el tiempo: _____ segundos

### Paso 2: Deshabilitar extensiones pesadas temporalmente
Deshabilita una por una y reinicia VS Code:

- [ ] GitHub Copilot
- [ ] GitLens
- [ ] Prettier
- [ ] ESLint
- [ ] Auto Import

### Paso 3: Medir después de cada deshabilitación
Tiempo de inicio sin:
- GitHub Copilot: _____ segundos
- GitLens: _____ segundos  
- Prettier: _____ segundos
- ESLint: _____ segundos
- Auto Import: _____ segundos

### Paso 4: Uso de CPU/RAM durante desarrollo
Con Task Manager abierto, nota el uso mientras:
- Abres archivos grandes: ____% CPU
- Escribes código: ____% CPU
- Auto-completado: ____% CPU
- Guardas archivos: ____% CPU

## Comandos útiles para diagnóstico

### Ver extensiones en ejecución:
```
Ctrl+Shift+P → "Developer: Show Running Extensions"
```

### Profiler de extensiones:
```
Ctrl+Shift+P → "Developer: Start Extension Host Profile"
(usar VS Code 30 segundos)
Ctrl+Shift+P → "Developer: Stop Extension Host Profile"
```

### Recargar sin extensiones:
```
Ctrl+Shift+P → "Developer: Disable All Extensions"
```

### Logs de rendimiento:
```
Ctrl+Shift+P → "Developer: Set Log Level"
```

## Recomendaciones Específicas

### Para proyectos React/TypeScript grandes:
1. **Configura ESLint** para ignorar node_modules
2. **Limita Prettier** a archivos específicos
3. **Configura TypeScript** para excluir archivos innecesarios
4. **Usa .vscodeignore** para excluir archivos del indexado

### Configuración optimizada para tu proyecto:

#### .vscode/settings.json
```json
{
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.netlify": true,
    "**/coverage": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/Thumbs.db": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": false
  },
  "eslint.run": "onSave"
}
```

## Resultados

### Extensión más problemática: 
_________________

### Tiempo de mejora logrado:
_________________

### Configuración final recomendada:
_________________
