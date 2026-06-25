import { writeFileSync } from 'fs';
const commands = [
  'create-record usuarios_equipo nombre=Airhon email=airhon@vetadorada.com rol=Administrador estado=Activo',
  'create-record usuarios_equipo nombre=Harold email=harold@vetadorada.com rol="Taller / Producción" estado=Activo',
  'create-record usuarios_equipo nombre=Finanzas email=finanzas@vetadorada.com rol=Finanzas estado=Activo',
  'create-record usuarios_equipo nombre=Comercial email=comercial@vetadorada.com rol=Comercial estado=Activo',
  'commit --force'
].join('\n');
writeFileSync('temp_setup2.txt', commands);
