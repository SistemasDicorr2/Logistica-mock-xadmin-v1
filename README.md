ALCANCE DE IMPLEMENTACIÓN MÓDULO LOGÍSTICA
Objetivo Implementar un módulo de logística dentro del portal que permita visualizar cirugías, consultar su estado y preparación, registrar eventos logísticos y generar trazabilidad operativa con fecha, usuario y ubicación, sin modificar el circuito principal del sistema.
Alcance funcional
1. Lectura de datos existentes El módulo trabaja sobre la cirugía/expediente ya existente en el sistema. Debe consumir: expediente, paciente, médico, cliente, institución, fecha de cirugía y estado actual.
2. Nuevos campos (capa logística)
Preparación Campo asociado a la cirugía con los siguientes valores:
• Sin preparar
• Congelado
• Congelado con faltantes
• Retirado
• Enviado
Eventos logísticos (trazabilidad) Cada acción genera un registro vinculado al expediente con:
• expediente_id
• tipo_evento
• estado_anterior
• estado_nuevo
• preparacion_nueva
• fecha_hora
• usuario
• latitud
• longitud
• ubicacion_texto
• nota
3. Acciones disponibles
Acciones de preparación:
• Marcar como Retirado
• Marcar como Enviado
Acciones adicionales:
• Modificar Estado
• Agregar Nota ( la opción existente Reportar Problema, puede ser sustituida por nota para evitar generar una funcionalidad )
4. Reglas de negocio
• Retirado: cambia solo Preparación
• Enviado: cambia Preparación y puede derivar Estado a “En tránsito” si estaba Pendiente o Autorizado
• Modificación de Estado: cambia solo el Estado general
• Nota: no cambia estado ni preparación
• Problema: requiere nota obligatoria, no cambia automáticamente estado ni preparación
Interfaces
Vista escritorio (web) Debe incluir filtros, resumen, listado de cirugías, acciones por fila (compactadas), acceso a trazabilidad y detalle. Evitar saturación de botones.
Vista mobile (PWA) Debe incluir listado tipo card, mostrando expediente, paciente, institución, estado y preparación. Debe permitir acciones contextuales, ver trazabilidad y minimizar la ficha al abrir acciones.
Geolocalización
• Se solicita al confirmar acciones
• Si no hay ubicación activa, se bloquea la acción
• Se guarda latitud y longitud
• En la interfaz se muestra ubicación legible (calle + altura + ciudad)
Trazabilidad
Cada acción genera un registro visible con:
• fecha y hora
• usuario
• origen (Sistema RDP u operador)
• evento
• ubicación
• nota
Mapa (opcional en primera etapa)
• Visualización de cirugías
• Centrado en zona operativa (Corrientes)
• Uso principalmente informativo
Consideraciones clave
• El usuario no modifica estados directamente, registra eventos
• El sistema traduce esos eventos a estado y preparación
• La interfaz debe ser simple y clara
• Mobile PWA es prioritario en uso real
Entregables esperados
• Pantalla web integrada
• Vista mobile funcional
