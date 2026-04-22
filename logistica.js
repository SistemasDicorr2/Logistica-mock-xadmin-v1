(function (window, $) {
  'use strict';

  var CORRIENTES_CENTER = [-27.4692, -58.8306];
  var currentUser = 'Operador Demo';
  var dashboardMap = null;
  var mobileMap = null;
  var dashboardMarkers = [];
  var mobileMarkers = [];
  var selectedMobileId = null;
  var restoreMobileSheetAfterModal = false;
  var markerIndex = {};
  var users = [
    { id: 'u_demo', name: 'Operador Demo', role: 'Operador logistico' },
    { id: 'u_sistema', name: 'Sistema RDP', role: 'Sistema' },
    { id: 'u_deposito', name: 'Deposito Central', role: 'Deposito' }
  ];

  var logisticEvents = {
    retirar: {
      label: 'Marcar como Retirado',
      microcopy: 'Se registrará el cambio de preparación a Retirado.',
      preparation: 'Retirado',
      description: 'Actualiza solo la preparación de la caja. El estado general no cambia automáticamente.',
      requiresNote: false
    },
    enviar: {
      label: 'Marcar como Enviado',
      microcopy: 'Se registrará el cambio de preparación a Enviado.',
      preparation: 'Enviado',
      deriveState: function (currentState) {
        return currentState === 'Pendiente' || currentState === 'Autorizado' ? 'En tránsito' : currentState;
      },
      description: 'Actualiza la preparación a Enviado y, si corresponde, deriva el estado general a En tránsito.',
      requiresNote: false
    },
    modificar_preparacion: {
      label: 'Modificar preparacion',
      microcopy: 'Se registrara una modificacion manual de la preparacion.',
      description: 'Actualiza solo la Preparacion. No modifica el Estado general.',
      requiresPreparation: true,
      requiresNote: false
    },
    modificar_estado: {
      label: 'Modificar estado',
      microcopy: 'Se registrará una modificación manual del estado general.',
      description: 'Actualiza solo el Estado general de la cirugía. No modifica Preparación.',
      requiresState: true,
      requiresNote: false
    },
    nota: {
      label: 'Agregar nota',
      microcopy: 'Se agregará una observación operativa al expediente.',
      description: 'No modifica Estado ni Preparación. Solo agrega trazabilidad.',
      requiresNote: true
    },
    problema: {
      label: 'Reportar problema',
      microcopy: 'Se registrará una incidencia logística.',
      description: 'Registra una incidencia logística sin modificar Estado ni Preparación.',
      requiresNote: true
    }
  };

  var surgeries = [
    { id: '6071', client: 'IASEP', patient: 'SAMITE NATALIA', doctor: 'ARECO RODOLFO', surgeryDate: '20/04/26', state: 'En tránsito', preparation: 'Enviado', institution: 'Instituto de Cardiología de Corrientes', address: 'Bolívar 1334, Corrientes', lat: -27.4759, lng: -58.8298, authorization: 'S-007758/2026', initialEvent: 'Marcar como Enviado' },
    { id: '6058', client: 'PARTICULAR', patient: 'BAJENETA', doctor: 'BAJENETA LEANDRO', surgeryDate: '22/04/26', state: 'Autorizado', preparation: 'Congelado', institution: 'Sanatorio del Norte', address: 'Av. 3 de Abril 1200, Corrientes', lat: -27.4618, lng: -58.8361, authorization: '--', initialEvent: 'Carga inicial RDP' },
    { id: '6057', client: 'IASEP', patient: 'CARDOZO ALEJANDRO NICOLAS', doctor: 'BARRIOS CENTURION RAMON', surgeryDate: '21/04/26', state: 'En tránsito', preparation: 'Retirado', institution: 'Hospital Escuela General San Martín', address: 'Rivadavia 1250, Corrientes', lat: -27.4797, lng: -58.8158, authorization: 'C-007816/2026', initialEvent: 'Marcar como Retirado' },
    { id: '6045', client: 'ANDINA ART S.A.', patient: 'CACERES JUAN', doctor: 'ALVAREZ SALINAS EMILIANO', surgeryDate: '22/04/26', state: 'Pendiente', preparation: 'Sin preparar', institution: 'Clínica del Sol Corrientes', address: 'Mendoza 853, Corrientes', lat: -27.4862, lng: -58.7921, authorization: '00854000202400775700', initialEvent: 'Carga inicial RDP' },
    { id: '6042', client: 'PREVENCION ART', patient: 'CONTRERAS KEVIN', doctor: 'VERA OSCAR', surgeryDate: '22/04/26', state: 'Autorizado', preparation: 'Congelado con faltantes', institution: 'Sanatorio Güemes Corrientes', address: 'Güemes 1268, Corrientes', lat: -27.4674, lng: -58.8464, authorization: '2990564', initialEvent: 'Carga inicial RDP' },
    { id: '6008', client: 'MINISTERIO DE SALUD PUBLICA', patient: 'BARRIENTOS LUCAS', doctor: 'QUIROZ JAVIER', surgeryDate: '23/04/26', state: 'En tránsito', preparation: 'Enviado', institution: 'Hospital Vidal', address: 'Necochea 1050, Corrientes', lat: -27.4808, lng: -58.8391, authorization: '00000525/2026', initialEvent: 'Marcar como Enviado' },
    { id: '5989', client: 'IOSCOR', patient: 'CEBRERO PATRICIA', doctor: 'MARECO RODRIGO', surgeryDate: '22/04/26', state: 'Autorizado', preparation: 'Retirado', institution: 'Sanatorio Modelo Corrientes', address: 'Hipólito Yrigoyen 1810, Corrientes', lat: -27.4728, lng: -58.8233, authorization: '880-8886-2025', initialEvent: 'Agregar nota' },
    { id: '5965', client: 'PAMI', patient: 'RESQUIN ROMINA', doctor: 'OJEDA PASSI JUAN PABLO', surgeryDate: '23/04/26', state: 'En tránsito', preparation: 'Enviado', institution: 'Hospital Ángela I. de Llano', address: 'Av. Artigas 1502, Corrientes', lat: -27.4749, lng: -58.8046, authorization: '297574', initialEvent: 'Marcar como Enviado' }
  ];

  surgeries.forEach(function (item, index) {
    item.events = [{
      eventKey: 'carga_inicial',
      label: item.initialEvent,
      user: index % 2 ? 'Depósito Central' : 'Sistema RDP',
      dateTime: '22/04/2026 ' + (8 + index).toString().padStart(2, '0') + ':15',
      lat: item.lat,
      lng: item.lng,
      stateBefore: item.state,
      stateAfter: item.state,
      preparationBefore: item.preparation,
      preparationAfter: item.preparation,
      note: 'Mock asociado al expediente RDP #' + item.id,
      locationLabel: item.address,
      locationReference: item.institution
    }];
  });

  function hydrateJsonEvents(eventRows, userRows) {
    var userMap = {};
    (userRows || users).forEach(function (user) {
      userMap[user.id] = user.name;
    });

    surgeries.forEach(function (item) {
      var itemEvents = eventRows.filter(function (event) {
        return String(event.rdpExpedienteId) === String(item.id);
      });

      item.events = itemEvents.map(function (event) {
        event.user = event.user || userMap[event.userId] || currentUser;
        event.locationLabel = event.locationLabel || item.address;
        event.locationReference = event.locationReference || item.institution;
        return event;
      });
    });
  }

  function loadMockData(done) {
    if (!window.fetch) {
      done();
      return;
    }

    Promise.all([
      fetch('./data/cirugias.json').then(function (response) { return response.json(); }),
      fetch('./data/eventos.json').then(function (response) { return response.json(); }),
      fetch('./data/usuarios.json').then(function (response) { return response.json(); })
    ]).then(function (responses) {
      surgeries = responses[0];
      users = responses[2];
      currentUser = users[0] ? users[0].name : currentUser;
      hydrateJsonEvents(responses[1], users);
      done();
    }).catch(function () {
      done();
    });
  }

  function slug(value) {
    return value.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  function lastEvent(item) {
    return item.events && item.events.length ? item.events[0] : null;
  }

  function markerColor(item) {
    if (item.preparation === 'Congelado con faltantes') return '#ed5565';
    if (item.preparation === 'Retirado') return '#1ab394';
    if (item.preparation === 'Enviado' || item.state === 'En tránsito') return '#f8ac59';
    if (item.preparation === 'Congelado') return '#1c84c6';
    return '#8793a0';
  }

  function markerIcon(item) {
    return L.divIcon({
      className: 'logistics-marker',
      html: '<span style="background:' + markerColor(item) + '"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function dateForInput(value) {
    if (!value || value === '--') return '';
    var parts = value.split('/');
    return '20' + parts[2] + '-' + parts[1] + '-' + parts[0];
  }

  function nowStamp() {
    var now = new Date();
    return now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function findSurgery(id) {
    return surgeries.find(function (item) {
      return item.id === String(id);
    });
  }

  function filteredSurgeries() {
    var selectedDate = $('#filterDate').val();
    var selectedState = $('#filterStatus').val();
    var selectedPreparation = $('#filterPreparation').val();
    var search = ($('#filterSearch').val() || $('#mobileSearch').val() || '').toLowerCase().trim();

    return surgeries.filter(function (item) {
      var haystack = [item.id, item.client, item.patient, item.doctor, item.institution].join(' ').toLowerCase();
      return (!selectedDate || dateForInput(item.surgeryDate) === selectedDate) &&
        (!selectedState || item.state === selectedState) &&
        (!selectedPreparation || item.preparation === selectedPreparation) &&
        (!search || haystack.indexOf(search) !== -1);
    });
  }

  function renderBadges(item) {
    return '<div class="badge-row">' +
      '<span class="badge-status badge-' + slug(item.state) + '">Estado: ' + item.state + '</span>' +
      '<span class="badge-status badge-' + slug(item.preparation) + '">Preparación: ' + item.preparation + '</span>' +
    '</div>';
  }

  function allowedActions(item) {
    var actions = [];
    if (item.preparation === 'Sin preparar' || item.preparation === 'Congelado' || item.preparation === 'Congelado con faltantes') {
      actions.push(['retirar', 'Marcar como Retirado', 'btn-outline-info']);
      actions.push(['enviar', 'Marcar como Enviado', 'btn-outline-primary']);
    } else if (item.preparation === 'Retirado') {
      actions.push(['enviar', 'Marcar como Enviado', 'btn-outline-primary']);
    }

    actions.push(['modificar_preparacion', 'Modificar preparacion', 'btn-outline-secondary']);
    actions.push(['modificar_estado', 'Modificar estado', 'btn-outline-secondary']);
    actions.push(['nota', 'Agregar nota', 'btn-outline-secondary']);
    actions.push(['problema', 'Reportar problema', 'btn-outline-danger']);
    return actions;
  }

  function renderActionButtons(item, sizeClass) {
    return allowedActions(item).map(function (action) {
      return '<button type="button" class="btn ' + sizeClass + ' ' + action[2] + ' js-register-event" data-id="' + item.id + '" data-event="' + action[0] + '">' + action[1] + '</button>';
    }).join(' ');
  }

  function renderRowActionMenu(item) {
    var primaryActions = allowedActions(item).filter(function (action) {
      return action[0] !== 'problema';
    });

    return '<div class="btn-group">' +
      '<button type="button" class="btn btn-sm btn-outline-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Acciones</button>' +
      '<div class="dropdown-menu dropdown-menu-right">' +
        primaryActions.map(function (action) {
          return '<button type="button" class="dropdown-item js-register-event" data-id="' + item.id + '" data-event="' + action[0] + '">' + action[1] + '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function renderCard(item, context) {
    var event = lastEvent(item);
    return '<article class="surgery-card js-focus-surgery" data-id="' + item.id + '">' +
      '<div class="surgery-card-head">' +
        '<div><div class="surgery-id">Expte #' + item.id + '</div><div class="surgery-date">Fecha cirugía ' + item.surgeryDate + '</div></div>' +
        '<button type="button" class="btn btn-sm btn-outline-secondary js-detail" data-id="' + item.id + '">Detalle</button>' +
      '</div>' +
      '<h2>' + item.patient + '</h2>' +
      '<div class="surgery-meta">' +
        '<div><strong>Institución:</strong> ' + item.institution + '</div>' +
        '<div><strong>Médico:</strong> ' + item.doctor + '</div>' +
        '<div><strong>Cliente:</strong> ' + item.client + '</div>' +
      '</div>' +
      renderBadges(item) +
      '<div class="last-event"><strong>Último evento:</strong> ' + (event ? event.label + ' | ' + event.dateTime : 'Sin eventos') + '</div>' +
      '<div class="card-actions">' +
        (context === 'mobile'
          ? '<button type="button" class="btn btn-primary btn-block js-open-actions" data-id="' + item.id + '">Acciones</button><button type="button" class="btn btn-outline-secondary btn-block js-trace" data-id="' + item.id + '">Ver trazabilidad</button>'
          : renderActionButtons(item, 'btn-sm') + ' <button type="button" class="btn btn-outline-secondary btn-sm js-trace" data-id="' + item.id + '">Trazabilidad</button>'
        ) +
      '</div>' +
    '</article>';
  }

  function renderTable(items) {
    var rows = items.map(function (item) {
      var event = lastEvent(item);
      return '<tr class="js-focus-surgery" data-id="' + item.id + '">' +
        '<td>' + item.id + '</td>' +
        '<td>' + item.surgeryDate + '</td>' +
        '<td>' + item.patient + '</td>' +
        '<td>' + item.client + '</td>' +
        '<td>' + item.doctor + '</td>' +
        '<td><span class="badge-status badge-' + slug(item.state) + '">' + item.state + '</span></td>' +
        '<td><span class="badge-status badge-' + slug(item.preparation) + '">' + item.preparation + '</span></td>' +
        '<td>' + (event ? event.label : '-') + '</td>' +
        '<td class="text-right action-group">' +
          renderRowActionMenu(item) + ' ' +
          '<button type="button" class="btn btn-sm btn-outline-danger js-register-event" data-id="' + item.id + '" data-event="problema">Reportar problema</button> ' +
          '<button type="button" class="btn btn-sm btn-outline-secondary js-trace" data-id="' + item.id + '">Trazabilidad</button> ' +
          '<button type="button" class="btn btn-sm btn-outline-secondary js-detail" data-id="' + item.id + '">Detalle</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    $('#surgeryTableBody').html(rows || '<tr><td colspan="9" class="text-center text-muted">Sin resultados.</td></tr>');
    $('#dashboardCardList').html(items.map(function (item) { return renderCard(item, 'dashboard'); }).join('') || '<div class="text-muted p-3">Sin resultados.</div>');
    $('#resultCount').text(items.length + ' registro(s)');
  }

  function renderSummary(items) {
    var stateItems = [
      ['Pendientes', items.filter(function (x) { return x.state === 'Pendiente'; }).length],
      ['Autorizados', items.filter(function (x) { return x.state === 'Autorizado'; }).length],
      ['En tránsito', items.filter(function (x) { return x.state === 'En tránsito'; }).length]
    ];

    var preparationItems = [
      ['Sin preparar', items.filter(function (x) { return x.preparation === 'Sin preparar'; }).length],
      ['Congelados', items.filter(function (x) { return x.preparation === 'Congelado'; }).length],
      ['Congelados con faltantes', items.filter(function (x) { return x.preparation === 'Congelado con faltantes'; }).length],
      ['Enviados', items.filter(function (x) { return x.preparation === 'Enviado'; }).length],
      ['Retirados', items.filter(function (x) { return x.preparation === 'Retirado'; }).length]
    ];

    var stateHtml = '<div class="summary-title">Estado general</div>' + stateItems.map(function (item) {
      return '<div class="summary-item"><strong>' + item[1] + '</strong><span>' + item[0] + '</span></div>';
    }).join('');
    var prepHtml = '<div class="summary-title">Preparación</div>' + preparationItems.map(function (item) {
      return '<div class="summary-item"><strong>' + item[1] + '</strong><span>' + item[0] + '</span></div>';
    }).join('');

    $('#summaryGrid').html(stateHtml + prepHtml);
  }

  function mapItems(items) {
    return items.filter(function (item) {
      return item.state === 'En tránsito' || item.preparation === 'Enviado' || item.preparation === 'Retirado';
    });
  }

  function renderMarkers(map, markers, items) {
    markerIndex = {};
    markers.forEach(function (marker) { map.removeLayer(marker); });
    markers.length = 0;

    mapItems(items).forEach(function (item) {
      var marker = L.marker([item.lat, item.lng], { icon: markerIcon(item) }).addTo(map).bindPopup(
        '<strong>Expte #' + item.id + '</strong><br>' +
        item.patient + '<br>' +
        item.institution + '<br>' +
        item.address + '<br>' +
        'Estado: ' + item.state + '<br>' +
        'Preparación: ' + item.preparation + '<br>' +
        'Ubicación: ' + item.address
      );
      markers.push(marker);
      markerIndex[item.id] = marker;
    });

    map.setView(CORRIENTES_CENTER, 13);
    if (markers.length) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.18));
    }
  }

  function focusSurgeryOnMap(id) {
    var item = findSurgery(id);
    var map = dashboardMap || mobileMap;
    if (!item || !map) return;

    map.setView([item.lat, item.lng], 15);
    if (markerIndex[item.id]) {
      markerIndex[item.id].openPopup();
    }
  }

  function refreshDashboard() {
    var items = filteredSurgeries();
    renderTable(items);
    renderSummary(items);
    renderMarkers(dashboardMap, dashboardMarkers, items);
  }

  function geoErrorMessage(error) {
    if (!navigator.geolocation) {
      return 'Este navegador no permite obtener ubicación.';
    }
    if (!error) {
      return 'No se pudo obtener ubicación. Revisá permisos y GPS.';
    }
    if (error.code === error.PERMISSION_DENIED) {
      return 'Permiso de ubicación denegado. Habilitalo en el navegador o dispositivo.';
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return 'Ubicación no disponible. Activá GPS o datos móviles.';
    }
    if (error.code === error.TIMEOUT) {
      return 'Tiempo agotado al obtener ubicación. Intentá nuevamente.';
    }
    return 'No se pudo obtener ubicación.';
  }

  function getPosition(onStatus, callback) {
    onStatus('Obteniendo ubicación...', 'loading');
    if (!navigator.geolocation) {
      callback(null, geoErrorMessage());
      return;
    }

    navigator.geolocation.getCurrentPosition(function (position) {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }, null);
    }, function (error) {
      callback(null, geoErrorMessage(error));
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }

  function applyEventImpact(item, eventDefinition, newState, newPreparation) {
    if (eventDefinition.requiresState && newState) item.state = newState;
    if (eventDefinition.requiresPreparation && newPreparation) item.preparation = newPreparation;
    if (eventDefinition.deriveState) item.state = eventDefinition.deriveState(item.state);
    if (eventDefinition.state) item.state = eventDefinition.state;
    if (eventDefinition.preparation) item.preparation = eventDefinition.preparation;
  }

  function registerLogisticEvent(id, eventKey, note, position, newState, newPreparation) {
    var item = findSurgery(id);
    var eventDefinition = logisticEvents[eventKey];

    if (!item || !eventDefinition || !position) {
      return null;
    }

    var event = {
      rdpExpedienteId: item.id,
      eventKey: eventKey,
      label: eventDefinition.label,
      user: currentUser,
      dateTime: nowStamp(),
      lat: position.lat,
      lng: position.lng,
      locationLabel: readableLocation(item, position),
      locationReference: item.institution,
      stateBefore: item.state,
      stateAfter: eventDefinition.requiresState && newState ? newState : (eventDefinition.deriveState ? eventDefinition.deriveState(item.state) : (eventDefinition.state || item.state)),
      preparationBefore: item.preparation,
      preparationAfter: eventDefinition.requiresPreparation && newPreparation ? newPreparation : (eventDefinition.preparation || item.preparation),
      note: note || ''
    };

    applyEventImpact(item, eventDefinition, newState, newPreparation);
    item.lat = position.lat;
    item.lng = position.lng;
    item.events.unshift(event);

    // Integración futura:
    // return fetch('/api/rdp/expedientes/' + item.id + '/eventos-logisticos', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });
    return event;
  }

  function eventResult(item, eventKey, newState, newPreparation) {
    var eventDefinition = logisticEvents[eventKey];
    return {
      stateAfter: eventDefinition.requiresState && newState ? newState : (eventDefinition.deriveState ? eventDefinition.deriveState(item.state) : (eventDefinition.state || item.state)),
      preparationAfter: eventDefinition.requiresPreparation && newPreparation ? newPreparation : (eventDefinition.preparation || item.preparation)
    };
  }

  function impactText(eventKey, item) {
    var eventDefinition = logisticEvents[eventKey];
    if (!eventDefinition || !item) return 'Seleccioná un evento.';
    var result = eventResult(item, eventKey, $('#newState').val(), $('#newPreparation').val());
    var stateResult = result.stateAfter === item.state ? 'Sin cambio (' + item.state + ')' : result.stateAfter;
    var preparationResult = result.preparationAfter === item.preparation ? 'Sin cambio (' + item.preparation + ')' : result.preparationAfter;

    return '<div class="event-microcopy">' + eventDefinition.microcopy + '</div>' +
      '<div>' + eventDefinition.description + '</div>' +
      '<div class="system-derives">El operador registra el evento; el sistema deriva los estados resultantes.</div>' +
      '<div class="impact-grid">' +
        '<span>Estado actual</span><strong>' + item.state + '</strong>' +
        '<span>Resultado estado</span><strong>' + stateResult + '</strong>' +
        '<span>Preparación actual</span><strong>' + item.preparation + '</strong>' +
        '<span>Resultado preparación</span><strong>' + preparationResult + '</strong>' +
      '</div>';
  }

  function eventContextHtml(item, eventKey) {
    var eventDefinition = logisticEvents[eventKey];
    var eventLabel = eventDefinition ? eventDefinition.label : 'Seleccioná evento';
    return '<div class="event-context-title">Expediente RDP #' + item.id + '</div>' +
      '<div class="event-context-row"><span>Paciente</span><strong>' + item.patient + '</strong></div>' +
      '<div class="event-context-row"><span>Institución</span><strong>' + item.institution + '</strong></div>' +
      '<div class="event-context-row"><span>Ubicación</span><strong>' + item.address + '</strong></div>' +
      '<div class="event-context-row"><span>Evento</span><strong>' + eventLabel + '</strong></div>';
  }

  function readableLocation(item, position) {
    if (item && item.address) {
      return item.address;
    }
    if (position) {
      return 'Ubicación aproximada: Corrientes Capital';
    }
    return 'Ubicación aproximada: Corrientes, Argentina';
  }

  function updateEventModalView() {
    var id = $('#eventSurgeryId').val();
    var eventKey = $('#eventType').val();
    var item = findSurgery(id);
    var eventDefinition = logisticEvents[eventKey];
    if (!item || !eventDefinition) return;

    $('#eventContext').html(eventContextHtml(item, eventKey));
    $('#stateSelectGroup').toggleClass('d-none', !eventDefinition.requiresState);
    if (eventDefinition.requiresState) {
      $('#newState').val(item.state);
    }
    $('#preparationSelectGroup').toggleClass('d-none', !eventDefinition.requiresPreparation);
    if (eventDefinition.requiresPreparation) {
      $('#newPreparation').val(item.preparation);
    }
    $('#eventImpact').html(impactText(eventKey, item));
    $('#eventNote').prop('required', !!eventDefinition.requiresNote);
    $('#eventNoteHint').text(eventDefinition.requiresNote ? 'La nota es obligatoria para esta acción.' : 'La nota acompaña al registro de trazabilidad.');
    $('#eventGeoWarning').addClass('d-none').text('Para registrar este evento debés activar la ubicación del dispositivo.');
    $('#eventGeoState').removeClass('geo-ok geo-error geo-loading').text('La ubicación se solicitará al confirmar.');
  }

  function traceHtml(item) {
    return '<div class="timeline">' + item.events.map(function (entry) {
      var geo = entry.locationLabel || 'Ubicación aproximada: Corrientes, Argentina';
      var reference = entry.locationReference ? '<div class="text-soft">Referencia: ' + entry.locationReference + '</div>' : '';
      var stateChange = entry.stateBefore !== entry.stateAfter ? '<div>Estado: ' + entry.stateBefore + ' → ' + entry.stateAfter + '</div>' : '';
      var prepChange = entry.preparationBefore !== entry.preparationAfter ? '<div>Preparación: ' + entry.preparationBefore + ' → ' + entry.preparationAfter + '</div>' : '';

      return '<div class="timeline-item">' +
        '<div class="timeline-dot"></div>' +
        '<div class="timeline-card">' +
          '<strong>Evento: ' + entry.label + '</strong>' +
          '<div class="text-soft">' + entry.dateTime + ' | ' + entry.user + '</div>' +
          '<div class="text-soft">Ubicación: ' + geo + '</div>' +
          reference +
          stateChange +
          prepChange +
          (entry.note ? '<div class="timeline-note">Nota: ' + entry.note + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function showTrace(id) {
    var item = findSurgery(id);
    closeMobileSheet();
    focusSurgeryOnMap(id);
    $('#traceModalLabel').text('Trazabilidad expediente #' + item.id);
    $('#traceModalBody').html(traceHtml(item));
    $('#traceModal').modal('show');
  }

  function showDetail(id) {
    var item = findSurgery(id);
    var event = lastEvent(item);
    closeMobileSheet();
    focusSurgeryOnMap(id);
    $('#detailModalLabel').text('Detalle expediente #' + item.id);
    $('#detailModalBody').html(
      '<div class="row">' +
        '<div class="col-md-6"><strong>Paciente</strong><br>' + item.patient + '</div>' +
        '<div class="col-md-6"><strong>Cliente</strong><br>' + item.client + '</div>' +
        '<div class="col-md-6 mt-3"><strong>Médico</strong><br>' + item.doctor + '</div>' +
        '<div class="col-md-6 mt-3"><strong>Fecha cirugía</strong><br>' + item.surgeryDate + '</div>' +
        '<div class="col-md-6 mt-3"><strong>Autorización</strong><br>' + item.authorization + '</div>' +
        '<div class="col-md-6 mt-3"><strong>Institución</strong><br>' + item.institution + '</div>' +
        '<div class="col-md-6 mt-3"><strong>Ubicación</strong><br>' + item.address + '</div>' +
        '<div class="col-12 mt-3"><strong>Último evento</strong><br>' + (event ? event.label + ' | ' + event.dateTime : 'Sin eventos') + '</div>' +
      '</div>' +
      renderBadges(item)
    );
    $('#detailModal').modal('show');
  }

  function fillEventOptions(selectedKey) {
    var keys = selectedKey ? [selectedKey] : Object.keys(logisticEvents);
    var options = keys.map(function (key) {
      var selected = key === selectedKey ? ' selected' : '';
      return '<option value="' + key + '"' + selected + '>' + logisticEvents[key].label + '</option>';
    }).join('');

    if ($('#eventType').is('select')) {
      $('#eventType').html(options);
    } else {
      $('#eventType').val(selectedKey || 'retirar');
    }
  }

  function openEventModal(id, eventKey) {
    var selectedKey = eventKey || 'retirar';
    restoreMobileSheetAfterModal = $('#mobileActionPanel').hasClass('open');
    closeMobileSheet();
    $('#eventSurgeryId').val(id);
    fillEventOptions(selectedKey);
    $('#eventNote').val('');
    $('#eventNote').removeClass('is-invalid');
    $('#eventModalLabel').text('Confirmar evento expediente #' + id);
    updateEventModalView();
    focusSurgeryOnMap(id);
    $('#eventModal').modal('show');
  }

  function bindSharedClicks(container) {
    $(container).on('click', '.js-trace', function (event) {
      event.stopPropagation();
      showTrace($(this).data('id'));
    });
    $(container).on('click', '.js-detail', function (event) {
      event.stopPropagation();
      showDetail($(this).data('id'));
    });
    $(container).on('click', '.js-register-event', function (event) {
      event.stopPropagation();
      openEventModal($(this).data('id'), $(this).data('event'));
    });
    $(container).on('click', '.js-focus-surgery', function () {
      focusSurgeryOnMap($(this).data('id'));
    });
  }

  function setGeoState(message, statusClass) {
    $('#eventGeoState')
      .removeClass('geo-ok geo-error geo-loading')
      .addClass(statusClass ? 'geo-' + statusClass : '')
      .text(message);
  }

  function confirmEvent(id, eventKey, note, onSuccess, button, newState, newPreparation) {
    var eventDefinition = logisticEvents[eventKey];
    if (eventDefinition.requiresNote && !note.trim()) {
      $('#eventNote').addClass('is-invalid').focus();
      $('#eventGeoWarning').removeClass('d-none').text('Para reportar un problema tenés que agregar una nota.');
      return;
    }

    $('#eventNote').removeClass('is-invalid');
    $('#eventGeoWarning').addClass('d-none');
    if (button) button.prop('disabled', true);

    getPosition(setGeoState, function (position, errorMessage) {
      if (!position) {
        if (button) button.prop('disabled', false);
        setGeoState('No se pudo obtener ubicación', 'error');
        $('#eventGeoWarning').removeClass('d-none').text(errorMessage || 'Para registrar este evento debés activar la ubicación del dispositivo.');
        return;
      }

      setGeoState('Ubicación capturada', 'ok');
      var event = registerLogisticEvent(id, eventKey, note, position, newState, newPreparation);
      if (button) button.prop('disabled', false);
      onSuccess(event, position);
    });
  }

  function bindEventForm(afterSuccess) {
    $('#eventType').on('change', updateEventModalView);
    $('#newState').on('change', updateEventModalView);
    $('#newPreparation').on('change', updateEventModalView);
    $('#eventForm').on('submit', function (event) {
      event.preventDefault();
      confirmEvent(
        $('#eventSurgeryId').val(),
        $('#eventType').val(),
        $('#eventNote').val(),
        afterSuccess,
        $('#confirmEvent'),
        $('#newState').val(),
        $('#newPreparation').val()
      );
    });
  }

  function initDashboard() {
    if ($.fn.selectpicker) $('.selectpicker').selectpicker();

    dashboardMap = L.map('logisticsMap').setView(CORRIENTES_CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(dashboardMap);

    $('#filterForm').on('submit', function (event) {
      event.preventDefault();
      refreshDashboard();
    });
    $('#filterDate, #filterStatus, #filterPreparation, #filterSearch').on('change keyup', refreshDashboard);
    $('#refreshDashboard').on('click', refreshDashboard);
    $('#printTracePdf').on('click', function () {
      window.print();
    });
    bindSharedClicks(document);
    bindEventForm(function (createdEvent) {
      $('#lastAction').text(createdEvent.dateTime + ' - ' + createdEvent.label + ' registrado en expediente #' + createdEvent.rdpExpedienteId + '.');
      $('#eventModal').modal('hide');
      refreshDashboard();
      focusSurgeryOnMap(createdEvent.rdpExpedienteId);
    });

    loadMockData(refreshDashboard);
  }

  function renderMobileList() {
    var items = filteredSurgeries();
    $('#mobileList').html(items.map(function (item) { return renderCard(item, 'mobile'); }).join('') || '<div class="text-muted">Sin resultados.</div>');
    renderMarkers(mobileMap, mobileMarkers, items);
  }

  function updateGeoStatus(position, errorMessage) {
    if (!position) {
      $('#geoStatus').text(errorMessage || 'Ubicación pendiente');
      return;
    }
    $('#geoStatus').text('Ubicación activa');
  }

  function openMobileSheet(id) {
    var item = findSurgery(id);
    selectedMobileId = id;
    focusSurgeryOnMap(id);
    $('#sheetTitle').text('#' + item.id);
    $('#sheetSummary').html(
      '<strong>' + item.patient + '</strong><br>' +
      item.institution + '<br>' +
      item.address + '<br>' +
      'Médico: ' + item.doctor +
      renderBadges(item) +
      '<div class="last-event"><strong>Último evento:</strong> ' + lastEvent(item).label + '</div>'
    );
    updateMobileActions(item);
    $('#mobileActionPanel').addClass('open').attr('aria-hidden', 'false');
  }

  function updateMobileActions(item) {
    $('.action-btn').removeClass('d-none');

    if (item.preparation === 'Enviado') {
      $('.action-btn[data-event="retirar"]').addClass('d-none');
      $('.action-btn[data-event="enviar"]').addClass('d-none');
    }

    if (item.preparation === 'Retirado') {
      $('.action-btn[data-event="retirar"]').addClass('d-none');
    }
  }

  function closeMobileSheet() {
    $('#mobileActionPanel').removeClass('open').attr('aria-hidden', 'true');
  }

  function initMobile() {
    mobileMap = L.map('mobileMap').setView(CORRIENTES_CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mobileMap);

    $('#enableLocation').on('click', function () {
      getPosition(function (message) {
        $('#geoStatus').text(message);
      }, updateGeoStatus);
    });
    $('#mobileSearch').on('keyup', renderMobileList);
    $('#mobileClear').on('click', function () {
      $('#mobileSearch').val('');
      renderMobileList();
    });
    $('#mobileList').on('click', '.js-open-actions', function (event) {
      event.stopPropagation();
      openMobileSheet($(this).data('id'));
    });
    $('#mobileList').on('click', '.js-trace', function (event) {
      event.stopPropagation();
      showTrace($(this).data('id'));
    });
    $('#mobileList').on('click', '.js-detail', function (event) {
      event.stopPropagation();
      showDetail($(this).data('id'));
    });
    $('#mobileList').on('click', '.js-focus-surgery', function () {
      focusSurgeryOnMap($(this).data('id'));
    });
    $('#closeSheet').on('click', closeMobileSheet);
    $('#sheetTrace').on('click', function () { showTrace(selectedMobileId); });
    $('#printTracePdf').on('click', function () {
      window.print();
    });
    $('.action-btn').on('click', function () {
      openEventModal(selectedMobileId, $(this).data('event'));
    });
    bindEventForm(function (createdEvent, position) {
      updateGeoStatus(position);
      restoreMobileSheetAfterModal = false;
      $('#eventModal').modal('hide');
      closeMobileSheet();
      renderMobileList();
      focusSurgeryOnMap(createdEvent.rdpExpedienteId);
    });

    $('#eventModal').on('hidden.bs.modal', function () {
      if (restoreMobileSheetAfterModal && selectedMobileId) {
        restoreMobileSheetAfterModal = false;
        openMobileSheet(selectedMobileId);
      }
    });

    loadMockData(renderMobileList);
  }

  window.LogisticaPanel = {
    initDashboard: initDashboard,
    initMobile: initMobile,
    mockData: surgeries,
    logisticEvents: logisticEvents
  };
})(window, window.jQuery);
