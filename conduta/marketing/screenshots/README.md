# Screenshots locais

Os cenários em `scenarios/` são configurações declarativas para capturas locais e devem usar somente dados fictícios. Por padrão, todos estão desativados.

Para habilitar uma captura, a pessoa responsável deve preparar uma sessão local mockada, revisar as máscaras e definir `MARKETING_SCREENSHOT_ALLOW=true` e `MARKETING_SCREENSHOT_BASE_URL=http://127.0.0.1:...`. O script não aceita credenciais nem grava tokens no repositório.

Quando o ambiente não estiver preparado, `npm run marketing:screenshot` encerra de forma segura sem capturar nada.
