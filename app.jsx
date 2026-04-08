import React, { useMemo, useRef, useState } from "react";

const TABLES = {
  agency: {
    label: "agency.txt",
    required: true,
    pk: ["agency_id"],
    fields: [
      { name: "agency_id", type: "ID", pk: true, desc: "Identificativo univoco dell'agenzia di trasporto" },
      { name: "agency_name", type: "Text", desc: "Nome completo dell'agenzia di trasporto" },
      { name: "agency_url", type: "URL", desc: "URL del sito web dell'agenzia" },
      { name: "agency_timezone", type: "Timezone", desc: "Fuso orario dell'agenzia" },
      { name: "agency_lang", type: "Language", desc: "Lingua principale dell'agenzia" },
      { name: "agency_phone", type: "Phone", desc: "Numero di telefono dell'agenzia" },
      { name: "agency_fare_url", type: "URL", desc: "URL della pagina tariffe" },
      { name: "agency_email", type: "Email", desc: "Email del servizio clienti" },
    ],
  },
  stops: {
    label: "stops.txt",
    required: true,
    pk: ["stop_id"],
    fields: [
      { name: "stop_id", type: "ID", pk: true, desc: "Identificativo univoco della fermata/stazione" },
      { name: "stop_code", type: "Text", desc: "Codice breve della fermata visibile ai passeggeri" },
      { name: "stop_name", type: "Text", desc: "Nome della fermata come appare sulla segnaletica" },
      { name: "tts_stop_name", type: "Text", desc: "Versione leggibile del nome per text-to-speech" },
      { name: "stop_desc", type: "Text", desc: "Descrizione della fermata" },
      { name: "stop_lat", type: "Latitude", desc: "Latitudine WGS84 della fermata" },
      { name: "stop_lon", type: "Longitude", desc: "Longitudine WGS84 della fermata" },
      { name: "zone_id", type: "ID", desc: "Zona tariffaria della fermata" },
      { name: "stop_url", type: "URL", desc: "URL della pagina web della fermata" },
      { name: "location_type", type: "Enum", desc: "Tipo: 0=Fermata, 1=Stazione, 2=Ingresso/Uscita, 3=Nodo, 4=Area imbarco" },
      { name: "parent_station", type: "FK→stops", fk: "stops.stop_id", desc: "ID della stazione padre (gerarchia fermate)" },
      { name: "stop_timezone", type: "Timezone", desc: "Fuso orario della fermata (eredita dal padre)" },
      { name: "wheelchair_boarding", type: "Enum", desc: "Accessibilità sedie a rotelle: 0=N/D, 1=Sì, 2=No" },
      { name: "level_id", type: "FK→levels", fk: "levels.level_id", desc: "Livello della fermata nella stazione" },
      { name: "platform_code", type: "Text", desc: "Identificativo del binario/marciapiede (es. 'G', '3')" },
    ],
  },
  routes: {
    label: "routes.txt",
    required: true,
    pk: ["route_id"],
    fields: [
      { name: "route_id", type: "ID", pk: true, desc: "Identificativo univoco della linea" },
      { name: "agency_id", type: "FK→agency", fk: "agency.agency_id", desc: "Agenzia a cui appartiene la linea" },
      { name: "route_short_name", type: "Text", desc: "Nome breve della linea (es. '32', 'Verde')" },
      { name: "route_long_name", type: "Text", desc: "Nome completo della linea, spesso include destinazione" },
      { name: "route_desc", type: "Text", desc: "Descrizione della linea" },
      { name: "route_type", type: "Enum", desc: "Tipo mezzo: 0=Tram, 1=Metro, 2=Treno, 3=Bus, 4=Traghetto, 5=Funicolare..." },
      { name: "route_url", type: "URL", desc: "URL della pagina web della linea" },
      { name: "route_color", type: "Color", desc: "Colore della linea in esadecimale (es. 'FF0000')" },
      { name: "route_text_color", type: "Color", desc: "Colore del testo su sfondo route_color" },
      { name: "route_sort_order", type: "Integer", desc: "Ordine di visualizzazione (valori minori = prima)" },
      { name: "continuous_pickup", type: "Enum", desc: "Salita continua lungo il percorso: 0=Sì, 1=No, 2=Telefono, 3=Autista" },
      { name: "continuous_drop_off", type: "Enum", desc: "Discesa continua lungo il percorso: 0=Sì, 1=No, 2=Telefono, 3=Autista" },
      { name: "network_id", type: "ID", desc: "Rete tariffaria di appartenenza della linea" },
    ],
  },
  trips: {
    label: "trips.txt",
    required: true,
    pk: ["trip_id"],
    fields: [
      { name: "route_id", type: "FK→routes", fk: "routes.route_id", desc: "Linea a cui appartiene la corsa" },
      { name: "service_id", type: "FK→calendar", fk: "calendar.service_id", desc: "Calendario di servizio della corsa" },
      { name: "trip_id", type: "ID", pk: true, desc: "Identificativo univoco della corsa" },
      { name: "trip_headsign", type: "Text", desc: "Testo della destinazione mostrato sul mezzo" },
      { name: "trip_short_name", type: "Text", desc: "Nome pubblico della corsa (es. numero treno)" },
      { name: "direction_id", type: "Enum", desc: "Direzione: 0=Andata, 1=Ritorno" },
      { name: "block_id", type: "ID", desc: "Blocco veicolo (corse consecutive stesso mezzo)" },
      { name: "shape_id", type: "FK→shapes", fk: "shapes.shape_id", desc: "Percorso geografico della corsa" },
      { name: "wheelchair_accessible", type: "Enum", desc: "Accessibilità: 0=N/D, 1=Sì, 2=No" },
      { name: "bikes_allowed", type: "Enum", desc: "Bici ammesse: 0=N/D, 1=Sì, 2=No" },
    ],
  },
  stop_times: {
    label: "stop_times.txt",
    required: true,
    pk: ["trip_id", "stop_sequence"],
    fields: [
      { name: "trip_id", type: "FK→trips", fk: "trips.trip_id", desc: "Corsa di riferimento" },
      { name: "arrival_time", type: "Time", desc: "Orario di arrivo (formato HH:MM:SS, può superare 24:00)" },
      { name: "departure_time", type: "Time", desc: "Orario di partenza (formato HH:MM:SS)" },
      { name: "stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Fermata servita" },
      { name: "stop_sequence", type: "Integer", pk: true, desc: "Ordine progressivo della fermata nella corsa" },
      { name: "stop_headsign", type: "Text", desc: "Destinazione mostrata a questa fermata (sovrascrive trip)" },
      { name: "pickup_type", type: "Enum", desc: "Tipo salita: 0=Regolare, 1=No, 2=Telefono, 3=Autista" },
      { name: "drop_off_type", type: "Enum", desc: "Tipo discesa: 0=Regolare, 1=No, 2=Telefono, 3=Autista" },
      { name: "continuous_pickup", type: "Enum", desc: "Salita continua (sovrascrive valore della linea)" },
      { name: "continuous_drop_off", type: "Enum", desc: "Discesa continua (sovrascrive valore della linea)" },
      { name: "shape_dist_traveled", type: "Float", desc: "Distanza percorsa lungo lo shape dalla prima fermata" },
      { name: "timepoint", type: "Enum", desc: "Precisione orario: 0=Approssimato, 1=Esatto" },
    ],
  },
  calendar: {
    label: "calendar.txt",
    required: false,
    pk: ["service_id"],
    fields: [
      { name: "service_id", type: "ID", pk: true, desc: "Identificativo del calendario di servizio" },
      { name: "monday", type: "Enum", desc: "Servizio attivo il lunedì: 1=Sì, 0=No" },
      { name: "tuesday", type: "Enum", desc: "Servizio attivo il martedì" },
      { name: "wednesday", type: "Enum", desc: "Servizio attivo il mercoledì" },
      { name: "thursday", type: "Enum", desc: "Servizio attivo il giovedì" },
      { name: "friday", type: "Enum", desc: "Servizio attivo il venerdì" },
      { name: "saturday", type: "Enum", desc: "Servizio attivo il sabato" },
      { name: "sunday", type: "Enum", desc: "Servizio attivo la domenica" },
      { name: "start_date", type: "Date", desc: "Data inizio validità (formato YYYYMMDD)" },
      { name: "end_date", type: "Date", desc: "Data fine validità (inclusa)" },
    ],
  },
  calendar_dates: {
    label: "calendar_dates.txt",
    required: false,
    pk: ["service_id", "date"],
    fields: [
      { name: "service_id", type: "FK→calendar", fk: "calendar.service_id", desc: "Calendario di servizio modificato" },
      { name: "date", type: "Date", pk: true, desc: "Data dell'eccezione (formato YYYYMMDD)" },
      { name: "exception_type", type: "Enum", desc: "Tipo: 1=Servizio aggiunto, 2=Servizio rimosso" },
    ],
  },
  shapes: {
    label: "shapes.txt",
    required: false,
    pk: ["shape_id", "shape_pt_sequence"],
    fields: [
      { name: "shape_id", type: "ID", pk: true, desc: "Identificativo del percorso geografico" },
      { name: "shape_pt_lat", type: "Latitude", desc: "Latitudine del punto del percorso" },
      { name: "shape_pt_lon", type: "Longitude", desc: "Longitudine del punto del percorso" },
      { name: "shape_pt_sequence", type: "Integer", pk: true, desc: "Ordine del punto nel percorso" },
      { name: "shape_dist_traveled", type: "Float", desc: "Distanza percorsa dall'inizio dello shape" },
    ],
  },
  frequencies: {
    label: "frequencies.txt",
    required: false,
    pk: ["trip_id", "start_time"],
    fields: [
      { name: "trip_id", type: "FK→trips", fk: "trips.trip_id", desc: "Corsa con frequenza definita" },
      { name: "start_time", type: "Time", pk: true, desc: "Orario inizio intervallo di frequenza" },
      { name: "end_time", type: "Time", desc: "Orario fine intervallo di frequenza" },
      { name: "headway_secs", type: "Integer", desc: "Intervallo in secondi tra le corse (headway)" },
      { name: "exact_times", type: "Enum", desc: "0=Frequenza approssimata, 1=Orari esatti calcolati" },
    ],
  },
  transfers: {
    label: "transfers.txt",
    required: false,
    pk: ["from_stop_id", "to_stop_id", "from_trip_id", "to_trip_id", "from_route_id", "to_route_id"],
    fields: [
      { name: "from_stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Fermata di partenza dell'interscambio" },
      { name: "to_stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Fermata di arrivo dell'interscambio" },
      { name: "from_route_id", type: "FK→routes", fk: "routes.route_id", desc: "Linea di partenza" },
      { name: "to_route_id", type: "FK→routes", fk: "routes.route_id", desc: "Linea di arrivo" },
      { name: "from_trip_id", type: "FK→trips", fk: "trips.trip_id", desc: "Corsa di partenza" },
      { name: "to_trip_id", type: "FK→trips", fk: "trips.trip_id", desc: "Corsa di arrivo" },
      { name: "transfer_type", type: "Enum", desc: "Tipo: 0=Consigliato, 1=Temporizzato, 2=Tempo minimo, 3=Impossibile, 4=In-seat, 5=Re-board" },
      { name: "min_transfer_time", type: "Integer", desc: "Tempo minimo di interscambio in secondi" },
    ],
  },
  fare_attributes: {
    label: "fare_attributes.txt",
    required: false,
    pk: ["fare_id"],
    fields: [
      { name: "fare_id", type: "ID", pk: true, desc: "Identificativo univoco della classe tariffaria" },
      { name: "price", type: "Float", desc: "Prezzo della tariffa" },
      { name: "currency_type", type: "Currency", desc: "Codice valuta ISO 4217 (es. EUR)" },
      { name: "payment_method", type: "Enum", desc: "Pagamento: 0=A bordo, 1=Prima dell'imbarco" },
      { name: "transfers", type: "Enum", desc: "Trasferimenti: 0=Nessuno, 1=Uno, 2=Due, vuoto=Illimitati" },
      { name: "agency_id", type: "FK→agency", fk: "agency.agency_id", desc: "Agenzia della tariffa" },
      { name: "transfer_duration", type: "Integer", desc: "Durata validità trasferimento in secondi" },
    ],
  },
  fare_rules: {
    label: "fare_rules.txt",
    required: false,
    pk: ["*"],
    fields: [
      { name: "fare_id", type: "FK→fare_attr", fk: "fare_attributes.fare_id", desc: "Classe tariffaria" },
      { name: "route_id", type: "FK→routes", fk: "routes.route_id", desc: "Linea associata alla tariffa" },
      { name: "origin_id", type: "FK→stops.zone", fk: "stops.zone_id", desc: "Zona di origine" },
      { name: "destination_id", type: "FK→stops.zone", fk: "stops.zone_id", desc: "Zona di destinazione" },
      { name: "contains_id", type: "FK→stops.zone", fk: "stops.zone_id", desc: "Zone attraversate nel viaggio" },
    ],
  },
  fare_media: {
    label: "fare_media.txt",
    required: false,
    pk: ["fare_media_id"],
    fields: [
      { name: "fare_media_id", type: "ID", pk: true, desc: "Identificativo del supporto tariffario" },
      { name: "fare_media_name", type: "Text", desc: "Nome del supporto (es. carta contactless, app)" },
      { name: "fare_media_type", type: "Enum", desc: "Tipo: 0=Nessuno/contanti, 1=Biglietto cartaceo, 2=Carta trasporto, 3=cEMV, 4=App mobile" },
    ],
  },
  fare_products: {
    label: "fare_products.txt",
    required: false,
    pk: ["fare_product_id", "fare_media_id"],
    fields: [
      { name: "fare_product_id", type: "ID", pk: true, desc: "Identificativo del prodotto tariffario" },
      { name: "fare_product_name", type: "Text", desc: "Nome del prodotto (es. Corsa singola, Abbonamento)" },
      { name: "rider_category_id", type: "FK→rider_cat", fk: "rider_categories.rider_category_id", desc: "Categoria passeggero idonea" },
      { name: "fare_media_id", type: "FK→fare_media", fk: "fare_media.fare_media_id", pk: true, desc: "Supporto utilizzabile per il prodotto" },
      { name: "amount", type: "Currency", desc: "Costo del prodotto (può essere 0 o negativo per sconti)" },
      { name: "currency", type: "Currency", desc: "Codice valuta ISO 4217" },
    ],
  },
  rider_categories: {
    label: "rider_categories.txt",
    required: false,
    pk: ["rider_category_id"],
    fields: [
      { name: "rider_category_id", type: "ID", pk: true, desc: "Identificativo della categoria passeggero" },
      { name: "rider_category_name", type: "Text", desc: "Nome categoria (es. Adulto, Studente, Anziano)" },
      { name: "is_default_fare_category", type: "Enum", desc: "Categoria predefinita: 0=No, 1=Sì (es. Adulto)" },
      { name: "eligibility_url", type: "URL", desc: "URL con criteri di idoneità della categoria" },
    ],
  },
  fare_leg_rules: {
    label: "fare_leg_rules.txt",
    required: false,
    pk: ["network_id", "from_area_id", "to_area_id", "fare_product_id"],
    fields: [
      { name: "leg_group_id", type: "ID", desc: "Gruppo di regole tariffarie per la tratta" },
      { name: "network_id", type: "FK→networks", fk: "networks.network_id", desc: "Rete tariffaria applicabile" },
      { name: "from_area_id", type: "FK→areas", fk: "areas.area_id", desc: "Area di partenza" },
      { name: "to_area_id", type: "FK→areas", fk: "areas.area_id", desc: "Area di arrivo" },
      { name: "from_timeframe_group_id", type: "FK→timeframes", fk: "timeframes.timeframe_group_id", desc: "Fascia oraria di partenza" },
      { name: "to_timeframe_group_id", type: "FK→timeframes", fk: "timeframes.timeframe_group_id", desc: "Fascia oraria di arrivo" },
      { name: "fare_product_id", type: "FK→fare_prod", fk: "fare_products.fare_product_id", desc: "Prodotto tariffario richiesto" },
      { name: "rule_priority", type: "Integer", desc: "Priorità della regola (valori maggiori = precedenza)" },
    ],
  },
  fare_transfer_rules: {
    label: "fare_transfer_rules.txt",
    required: false,
    pk: ["from_leg_group_id", "to_leg_group_id", "fare_product_id"],
    fields: [
      { name: "from_leg_group_id", type: "FK→fare_leg", fk: "fare_leg_rules.leg_group_id", desc: "Gruppo regole tratta pre-trasferimento" },
      { name: "to_leg_group_id", type: "FK→fare_leg", fk: "fare_leg_rules.leg_group_id", desc: "Gruppo regole tratta post-trasferimento" },
      { name: "transfer_count", type: "Integer", desc: "Numero massimo trasferimenti consecutivi (-1=illimitati)" },
      { name: "duration_limit", type: "Integer", desc: "Durata limite del trasferimento in secondi" },
      { name: "duration_limit_type", type: "Enum", desc: "Come misurare la durata: 0-3 (partenza/arrivo prima-ultima tratta)" },
      { name: "fare_transfer_type", type: "Enum", desc: "Metodo di calcolo costo trasferimento" },
      { name: "fare_product_id", type: "FK→fare_prod", fk: "fare_products.fare_product_id", desc: "Prodotto richiesto per il trasferimento" },
    ],
  },
  areas: {
    label: "areas.txt",
    required: false,
    pk: ["area_id"],
    fields: [
      { name: "area_id", type: "ID", pk: true, desc: "Identificativo univoco dell'area" },
      { name: "area_name", type: "Text", desc: "Nome dell'area visibile ai passeggeri" },
    ],
  },
  stop_areas: {
    label: "stop_areas.txt",
    required: false,
    pk: ["*"],
    fields: [
      { name: "area_id", type: "FK→areas", fk: "areas.area_id", desc: "Area di appartenenza" },
      { name: "stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Fermata assegnata all'area" },
    ],
  },
  networks: {
    label: "networks.txt",
    required: false,
    pk: ["network_id"],
    fields: [
      { name: "network_id", type: "ID", pk: true, desc: "Identificativo della rete tariffaria" },
      { name: "network_name", type: "Text", desc: "Nome della rete tariffaria" },
    ],
  },
  route_networks: {
    label: "route_networks.txt",
    required: false,
    pk: ["route_id"],
    fields: [
      { name: "network_id", type: "FK→networks", fk: "networks.network_id", desc: "Rete di appartenenza" },
      { name: "route_id", type: "FK→routes", fk: "routes.route_id", desc: "Linea assegnata alla rete" },
    ],
  },
  timeframes: {
    label: "timeframes.txt",
    required: false,
    pk: ["*"],
    fields: [
      { name: "timeframe_group_id", type: "ID", pk: true, desc: "Gruppo di fasce orarie" },
      { name: "start_time", type: "Time", desc: "Inizio della fascia oraria (ora locale)" },
      { name: "end_time", type: "Time", desc: "Fine della fascia oraria (ora locale, esclusa)" },
      { name: "service_id", type: "FK→calendar", fk: "calendar.service_id", desc: "Calendario di validità" },
    ],
  },
  pathways: {
    label: "pathways.txt",
    required: false,
    pk: ["pathway_id"],
    fields: [
      { name: "pathway_id", type: "ID", pk: true, desc: "Identificativo univoco del percorso pedonale" },
      { name: "from_stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Posizione di partenza del percorso" },
      { name: "to_stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Posizione di arrivo del percorso" },
      { name: "pathway_mode", type: "Enum", desc: "Tipo: 1=Corridoio, 2=Scale, 3=Marciapiede mobile, 4=Scala mobile, 5=Ascensore, 6=Cancello, 7=Uscita" },
      { name: "is_bidirectional", type: "Enum", desc: "Bidirezionale: 0=Monodirezionale, 1=Bidirezionale" },
      { name: "length", type: "Float", desc: "Lunghezza orizzontale in metri" },
      { name: "traversal_time", type: "Integer", desc: "Tempo di percorrenza in secondi" },
      { name: "stair_count", type: "Integer", desc: "Numero di gradini (positivo=salita, negativo=discesa)" },
      { name: "max_slope", type: "Float", desc: "Pendenza massima (rapporto altezza/lunghezza)" },
      { name: "min_width", type: "Float", desc: "Larghezza minima in metri" },
      { name: "signposted_as", type: "Text", desc: "Testo sulla segnaletica verso il passeggero" },
      { name: "reversed_signposted_as", type: "Text", desc: "Testo sulla segnaletica in direzione opposta" },
    ],
  },
  levels: {
    label: "levels.txt",
    required: false,
    pk: ["level_id"],
    fields: [
      { name: "level_id", type: "ID", pk: true, desc: "Identificativo del livello nella stazione" },
      { name: "level_index", type: "Float", desc: "Indice numerico del livello (0=terra, negativo=sottosuolo)" },
      { name: "level_name", type: "Text", desc: "Nome del livello (es. 'Mezzanino', 'Banchina')" },
    ],
  },
  feed_info: {
    label: "feed_info.txt",
    required: false,
    pk: [],
    fields: [
      { name: "feed_publisher_name", type: "Text", desc: "Nome dell'ente che pubblica il dataset" },
      { name: "feed_publisher_url", type: "URL", desc: "URL dell'ente che pubblica il dataset" },
      { name: "feed_lang", type: "Language", desc: "Lingua predefinita del testo nel dataset" },
      { name: "default_lang", type: "Language", desc: "Lingua originale quando sono presenti traduzioni" },
      { name: "feed_start_date", type: "Date", desc: "Data inizio validità del feed" },
      { name: "feed_end_date", type: "Date", desc: "Data fine validità del feed" },
      { name: "feed_version", type: "Text", desc: "Versione del dataset GTFS" },
      { name: "feed_contact_email", type: "Email", desc: "Email per comunicazioni sul dataset" },
      { name: "feed_contact_url", type: "URL", desc: "URL per comunicazioni sul dataset" },
    ],
  },
  translations: {
    label: "translations.txt",
    required: false,
    pk: ["table_name", "field_name", "language", "record_id"],
    fields: [
      { name: "table_name", type: "Enum", desc: "Tabella contenente il campo da tradurre" },
      { name: "field_name", type: "Text", desc: "Nome del campo da tradurre" },
      { name: "language", type: "Language", desc: "Codice lingua IETF BCP 47 della traduzione" },
      { name: "translation", type: "Text", desc: "Il valore tradotto" },
      { name: "record_id", type: "ID", desc: "ID del record da tradurre (dipende dalla tabella)" },
      { name: "record_sub_id", type: "ID", desc: "Sub-ID per chiavi composte" },
      { name: "field_value", type: "Text", desc: "Valore esatto del campo da tradurre (alternativa a record_id)" },
    ],
  },
  attributions: {
    label: "attributions.txt",
    required: false,
    pk: [],
    fields: [
      { name: "attribution_id", type: "ID", desc: "Identificativo dell'attribuzione" },
      { name: "agency_id", type: "FK→agency", fk: "agency.agency_id", desc: "Agenzia a cui si applica" },
      { name: "route_id", type: "FK→routes", fk: "routes.route_id", desc: "Linea a cui si applica" },
      { name: "trip_id", type: "FK→trips", fk: "trips.trip_id", desc: "Corsa a cui si applica" },
      { name: "organization_name", type: "Text", desc: "Nome dell'organizzazione attribuita" },
      { name: "is_producer", type: "Enum", desc: "Ruolo produttore: 0=No, 1=Sì" },
      { name: "is_operator", type: "Enum", desc: "Ruolo operatore: 0=No, 1=Sì" },
      { name: "is_authority", type: "Enum", desc: "Ruolo autorità: 0=No, 1=Sì" },
      { name: "attribution_url", type: "URL", desc: "URL dell'organizzazione" },
      { name: "attribution_email", type: "Email", desc: "Email dell'organizzazione" },
      { name: "attribution_phone", type: "Phone", desc: "Telefono dell'organizzazione" },
    ],
  },
  location_groups: {
    label: "location_groups.txt",
    required: false,
    pk: ["location_group_id"],
    fields: [
      { name: "location_group_id", type: "ID", pk: true, desc: "Identificativo del gruppo di fermate (servizi a richiesta)" },
      { name: "location_group_name", type: "Text", desc: "Nome del gruppo di posizioni" },
    ],
  },
  location_group_stops: {
    label: "location_group_stops.txt",
    required: false,
    pk: ["*"],
    fields: [
      { name: "location_group_id", type: "FK→loc_groups", fk: "location_groups.location_group_id", desc: "Gruppo di posizioni" },
      { name: "stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Fermata nel gruppo" },
    ],
  },
  booking_rules: {
    label: "booking_rules.txt",
    required: false,
    pk: ["booking_rule_id"],
    fields: [
      { name: "booking_rule_id", type: "ID", pk: true, desc: "Identificativo della regola di prenotazione" },
      { name: "booking_type", type: "Enum", desc: "Tipo: 0=Tempo reale, 1=Stesso giorno, 2=Giorno prima" },
      { name: "prior_notice_duration_min", type: "Integer", desc: "Minuti di preavviso minimo" },
      { name: "prior_notice_duration_max", type: "Integer", desc: "Minuti di preavviso massimo" },
      { name: "prior_notice_last_day", type: "Integer", desc: "Ultimo giorno utile per prenotare (giorni prima)" },
      { name: "prior_notice_last_time", type: "Time", desc: "Ultimo orario utile per prenotare l'ultimo giorno" },
      { name: "prior_notice_start_day", type: "Integer", desc: "Primo giorno utile per prenotare" },
      { name: "prior_notice_start_time", type: "Time", desc: "Primo orario utile per prenotare" },
      { name: "prior_notice_service_id", type: "FK→calendar", fk: "calendar.service_id", desc: "Calendario per i giorni di prenotazione" },
      { name: "message", type: "Text", desc: "Messaggio per il passeggero durante la prenotazione" },
      { name: "pickup_message", type: "Text", desc: "Messaggio specifico per la salita" },
      { name: "drop_off_message", type: "Text", desc: "Messaggio specifico per la discesa" },
      { name: "phone_number", type: "Phone", desc: "Telefono per prenotazioni" },
      { name: "info_url", type: "URL", desc: "URL con informazioni sulla prenotazione" },
      { name: "booking_url", type: "URL", desc: "URL per effettuare la prenotazione online" },
    ],
  },
  fare_leg_join_rules: {
    label: "fare_leg_join_rules.txt",
    required: false,
    pk: ["from_network_id", "to_network_id"],
    fields: [
      { name: "from_network_id", type: "FK→networks", fk: "networks.network_id", desc: "Rete della tratta pre-trasferimento" },
      { name: "to_network_id", type: "FK→networks", fk: "networks.network_id", desc: "Rete della tratta post-trasferimento" },
      { name: "from_stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Fermata fine tratta pre-trasferimento" },
      { name: "to_stop_id", type: "FK→stops", fk: "stops.stop_id", desc: "Fermata inizio tratta post-trasferimento" },
    ],
  },
};

const GROUPS = [
  { id: "core", label: "Core (Obbligatori)", color: "#2563eb", tables: ["agency", "routes", "trips", "stops", "stop_times", "calendar", "calendar_dates"] },
  { id: "geo", label: "Percorsi & Frequenze", color: "#059669", tables: ["shapes", "frequencies"] },
  { id: "fare_v1", label: "Tariffe V1", color: "#d97706", tables: ["fare_attributes", "fare_rules"] },
  { id: "fare_v2", label: "Tariffe V2", color: "#dc2626", tables: ["fare_media", "fare_products", "rider_categories", "fare_leg_rules", "fare_leg_join_rules", "fare_transfer_rules", "timeframes", "areas", "stop_areas", "networks", "route_networks"] },
  { id: "access", label: "Accessibilità & Stazione", color: "#7c3aed", tables: ["pathways", "levels"] },
  { id: "flex", label: "Servizi a Richiesta", color: "#0891b2", tables: ["location_groups", "location_group_stops", "booking_rules"] },
  { id: "meta", label: "Metadati", color: "#6b7280", tables: ["feed_info", "translations", "attributions"] },
];

function getGroupForTable(tableKey) {
  return GROUPS.find(g => g.tables.includes(tableKey));
}

function TypeBadge({ type }) {
  const isFK = type.startsWith("FK");
  const isPK = false;
  let bg = "rgba(100,116,139,0.15)";
  let color = "#64748b";
  if (isFK) { bg = "rgba(99,102,241,0.12)"; color = "#6366f1"; }
  if (type === "ID") { bg = "rgba(234,179,8,0.15)"; color = "#a16207"; }
  if (type === "Enum") { bg = "rgba(16,185,129,0.12)"; color = "#047857"; }
  return (
    <span style={{
      fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: "1px 6px",
      borderRadius: 4, background: bg, color, whiteSpace: "nowrap", fontWeight: 600
    }}>{type}</span>
  );
}

function TableCard({ tableKey, table, isSelected, onClick, groupColor }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? "var(--card-selected)" : "var(--card-bg)",
        border: `1.5px solid ${isSelected ? groupColor : "var(--border)"}`,
        borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
        boxShadow: isSelected ? `0 0 0 3px ${groupColor}22, 0 4px 20px rgba(0,0,0,0.08)` : "0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div style={{
        padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
        background: `${groupColor}11`, borderBottom: `1px solid ${groupColor}22`
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: groupColor, flexShrink: 0,
          boxShadow: `0 0 6px ${groupColor}66`
        }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
          {table.label}
        </span>
        {table.required && (
          <span style={{ fontSize: 9, background: `${groupColor}22`, color: groupColor, padding: "1px 6px", borderRadius: 4, fontWeight: 700, marginLeft: "auto" }}>
            REQUIRED
          </span>
        )}
      </div>
      <div style={{ padding: "6px 14px 10px", fontSize: 11, color: "var(--text-muted)" }}>
        {table.fields.length} campi · PK: {table.pk.length === 0 ? "nessuna" : table.pk.join(", ")}
      </div>
    </div>
  );
}

function FieldDetail({ field }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px",
      padding: "8px 0", borderBottom: "1px solid var(--border-light)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {field.pk && <span style={{ color: "#eab308", fontSize: 11 }}>🔑</span>}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600,
          color: field.fk ? "#6366f1" : "var(--text)"
        }}>{field.name}</span>
      </div>
      <TypeBadge type={field.type} />
      <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, paddingLeft: field.pk ? 22 : 0 }}>
        {field.desc}
        {field.fk && <span style={{ display: "block", fontSize: 10.5, color: "#6366f1", marginTop: 2 }}>→ {field.fk}</span>}
      </div>
    </div>
  );
}

function RelationshipGraph({
  tables,
  groups,
  relations,
  selected,
  onSelect,
  showOnlyConnected,
  zoom,
}) {
  const layout = useMemo(() => {
    const nodeWidth = 168;
    const nodeHeight = 42;
    const colWidth = 210;
    const rowHeight = 64;
    const leftPad = 24;
    const topPad = 40;

    const positions = {};
    let maxRows = 0;

    groups.forEach((group, groupIndex) => {
      const x = leftPad + groupIndex * colWidth;
      group.tables.forEach((tableKey, rowIndex) => {
        if (!tables[tableKey]) return;
        const y = topPad + rowIndex * rowHeight;
        positions[tableKey] = {
          x,
          y,
          width: nodeWidth,
          height: nodeHeight,
          groupColor: group.color,
        };
      });
      maxRows = Math.max(maxRows, group.tables.length);
    });

    const width = leftPad * 2 + groups.length * colWidth;
    const height = topPad + maxRows * rowHeight + 36;
    return { positions, width, height };
  }, [tables, groups]);

  const connectedSet = useMemo(() => {
    if (!selected) return new Set();
    const set = new Set([selected]);
    relations.forEach((rel) => {
      if (rel.from === selected) set.add(rel.to);
      if (rel.to === selected) set.add(rel.from);
    });
    return set;
  }, [relations, selected]);

  const shownTableKeys = useMemo(() => {
    const all = Object.keys(layout.positions);
    if (!showOnlyConnected || !selected) return all;
    return all.filter((key) => connectedSet.has(key));
  }, [layout.positions, showOnlyConnected, selected, connectedSet]);

  const shownSet = useMemo(() => new Set(shownTableKeys), [shownTableKeys]);

  const shownRelations = useMemo(() => {
    return relations.filter((rel) => shownSet.has(rel.from) && shownSet.has(rel.to));
  }, [relations, shownSet]);

  const renderEdgePath = (fromKey, toKey) => {
    const a = layout.positions[fromKey];
    const b = layout.positions[toKey];
    if (!a || !b) return "";
    const sx = a.x + a.width;
    const sy = a.y + a.height / 2;
    const tx = b.x;
    const ty = b.y + b.height / 2;
    const dx = Math.max(30, Math.abs(tx - sx) * 0.45);
    return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
  };

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: 10,
      background: "var(--card-bg)",
      overflow: "auto",
      maxHeight: 470,
    }}>
      <div style={{
        minWidth: layout.width * zoom,
        minHeight: layout.height * zoom,
        transform: `scale(${zoom})`,
        transformOrigin: "top left",
      }}>
        <svg width={layout.width} height={layout.height}>
          {shownRelations.map((rel) => {
            const isSelectedEdge = selected && (rel.from === selected || rel.to === selected);
            return (
              <path
                key={`${rel.from}-${rel.to}`}
                d={renderEdgePath(rel.from, rel.to)}
                fill="none"
                stroke={isSelectedEdge ? "#0ea5e9" : "#64748b66"}
                strokeWidth={isSelectedEdge ? 2.3 : 1.2}
                opacity={isSelectedEdge ? 1 : 0.6}
              />
            );
          })}

          {shownTableKeys.map((tableKey) => {
            const p = layout.positions[tableKey];
            const table = tables[tableKey];
            const isSelected = selected === tableKey;
            const isConnected = connectedSet.has(tableKey);
            const dimmed = showOnlyConnected && selected && !isConnected;
            return (
              <g
                key={tableKey}
                onClick={() => onSelect(tableKey)}
                style={{ cursor: "pointer", opacity: dimmed ? 0.35 : 1 }}
              >
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.width}
                  height={p.height}
                  rx={8}
                  ry={8}
                  fill={isSelected ? `${p.groupColor}22` : "var(--panel-bg)"}
                  stroke={isSelected ? p.groupColor : "var(--border)"}
                  strokeWidth={isSelected ? 2 : 1.2}
                />
                <circle
                  cx={p.x + 10}
                  cy={p.y + 12}
                  r={4}
                  fill={p.groupColor}
                />
                <text
                  x={p.x + 20}
                  y={p.y + 16}
                  fontSize={10}
                  fill="var(--text-muted)"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {table.label}
                </text>
                <text
                  x={p.x + 10}
                  y={p.y + 33}
                  fontSize={10}
                  fill="var(--text)"
                  fontFamily="'Inter', sans-serif"
                >
                  {table.fields.length} campi
                </text>
                {table.required && (
                  <text
                    x={p.x + p.width - 36}
                    y={p.y + 33}
                    fontSize={9}
                    fill={p.groupColor}
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    req
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function buildOrthoPath(sx, sy, tx, ty) {
  const r = 10;
  if (Math.abs(ty - sy) < 4) return `M ${sx} ${sy} H ${tx}`;
  const mid = Math.max(sx + r * 3, tx > sx ? (sx + tx) / 2 : sx + 50);
  const vs = ty > sy ? 1 : -1;
  const hs = tx > mid ? 1 : -1;
  const sweep1 = vs > 0 ? 1 : 0;
  let sweep2, ex;
  if (vs > 0 && hs > 0) { sweep2 = 0; ex = mid + r; }
  else if (vs > 0 && hs < 0) { sweep2 = 1; ex = mid - r; }
  else if (vs < 0 && hs > 0) { sweep2 = 1; ex = mid + r; }
  else { sweep2 = 0; ex = mid - r; }
  return [
    `M ${sx} ${sy}`,
    `H ${mid - r}`,
    `A ${r} ${r} 0 0 ${sweep1} ${mid} ${sy + vs * r}`,
    `V ${ty - vs * r}`,
    `A ${r} ${r} 0 0 ${sweep2} ${ex} ${ty}`,
    `H ${tx}`,
  ].join(" ");
}

export default function GTFSSchema() {
  const CARD_WIDTH = 320;
  const CARD_HEADER = 38;
  const FIELD_ROW = 22;

  const getCardHeight = (tableKey) => CARD_HEADER + TABLES[tableKey].fields.length * FIELD_ROW + 10;

  const buildInitialPositions = () => {
    const positions = {};
    const colGap = 90;
    const startX = 50;
    const startY = 50;

    GROUPS.forEach((group, groupIndex) => {
      let y = startY;
      const x = startX + groupIndex * (CARD_WIDTH + colGap);
      group.tables.forEach((tableKey) => {
        if (!TABLES[tableKey]) return;
        positions[tableKey] = { x, y };
        y += getCardHeight(tableKey) + 26;
      });
    });

    const leftovers = Object.keys(TABLES).filter((key) => !positions[key]);
    let y = startY;
    const x = startX + GROUPS.length * (CARD_WIDTH + colGap);
    leftovers.forEach((tableKey) => {
      positions[tableKey] = { x, y };
      y += getCardHeight(tableKey) + 26;
    });

    return positions;
  };

  // Layout automatico: calcola i livelli di ogni tabella in base alle FK (DAG topologico)
  const buildAutoLayout = () => {
    const allKeys = Object.keys(TABLES);
    // Costruisce adiacenze
    const outEdges = {};
    const inDeg = {};
    allKeys.forEach((k) => { outEdges[k] = []; inDeg[k] = 0; });
    allKeys.forEach((k) => {
      TABLES[k].fields.forEach((f) => {
        if (!f.fk) return;
        const to = f.fk.split(".")[0];
        if (!TABLES[to] || to === k) return;
        if (!outEdges[k].includes(to)) {
          outEdges[k].push(to);
          inDeg[to] = (inDeg[to] || 0) + 1;
        }
      });
    });
    // Topoligical sort (Kahn) per assegnare livello
    const level = {};
    const queue = allKeys.filter((k) => inDeg[k] === 0);
    queue.forEach((k) => { level[k] = 0; });
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      outEdges[cur].forEach((nb) => {
        if (level[nb] === undefined || level[nb] <= level[cur]) {
          level[nb] = level[cur] + 1;
        }
        inDeg[nb]--;
        if (inDeg[nb] === 0) queue.push(nb);
      });
    }
    // Nodi non raggiunti (cicli)
    allKeys.forEach((k) => { if (level[k] === undefined) level[k] = 0; });

    // Raggruppa per livello
    const byLevel = {};
    allKeys.forEach((k) => {
      const l = level[k];
      if (!byLevel[l]) byLevel[l] = [];
      byLevel[l].push(k);
    });

    const colGap = 90;
    const rowGap = 32;
    const startX = 50;
    const startY = 50;
    const positions = {};

    Object.keys(byLevel).sort((a, b) => a - b).forEach((lv) => {
      const x = startX + Number(lv) * (CARD_WIDTH + colGap);
      let y = startY;
      byLevel[lv].forEach((k) => {
        positions[k] = { x, y };
        y += getCardHeight(k) + rowGap;
      });
    });
    return positions;
  };

  const [selected, setSelected] = useState("agency");
  const [selectedField, setSelectedField] = useState(null);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState(buildInitialPositions);

  const interactionRef = useRef(null);

  const selectedTable = TABLES[selected];
  const selectedGroup = getGroupForTable(selected);

  const allRelations = useMemo(() => {
    const rels = [];
    Object.entries(TABLES).forEach(([fromTable, table]) => {
      table.fields.forEach((field) => {
        if (!field.fk) return;
        const toTable = field.fk.split(".")[0];
        if (!TABLES[toTable]) return;
        rels.push({ from: fromTable, to: toTable, field: field.name, target: field.fk });
      });
    });
    return rels;
  }, []);

  const matchesSearch = useMemo(() => {
    if (!search) return new Set(Object.keys(TABLES));
    const s = search.toLowerCase();
    const set = new Set();
    Object.entries(TABLES).forEach(([key, table]) => {
      const hit =
        table.label.toLowerCase().includes(s) ||
        key.toLowerCase().includes(s) ||
        table.fields.some((f) => f.name.toLowerCase().includes(s) || f.desc.toLowerCase().includes(s));
      if (hit) set.add(key);
    });
    return set;
  }, [search]);

  const handlePointerDownCanvas = (e) => {
    if (e.target !== e.currentTarget) return;
    interactionRef.current = {
      type: "pan",
      lastX: e.clientX,
      lastY: e.clientY,
    };
  };

  const handlePointerDownCard = (e, tableKey) => {
    e.stopPropagation();
    setSelected(tableKey);
    setSelectedField(null);
    interactionRef.current = {
      type: "drag",
      tableKey,
      lastX: e.clientX,
      lastY: e.clientY,
    };
  };

  const handlePointerMove = (e) => {
    if (!interactionRef.current) return;
    const dx = e.clientX - interactionRef.current.lastX;
    const dy = e.clientY - interactionRef.current.lastY;
    interactionRef.current.lastX = e.clientX;
    interactionRef.current.lastY = e.clientY;

    if (interactionRef.current.type === "pan") {
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      return;
    }

    if (interactionRef.current.type === "drag") {
      const key = interactionRef.current.tableKey;
      setPositions((prev) => ({
        ...prev,
        [key]: {
          x: prev[key].x + dx / zoom,
          y: prev[key].y + dy / zoom,
        },
      }));
    }
  };

  const endInteraction = () => {
    interactionRef.current = null;
  };

  const vars = darkMode ? {
    "--bg": "#0d1117", "--card-bg": "#161b22", "--card-selected": "#1f2937",
    "--text": "#e5e7eb", "--text-muted": "#9ca3af", "--border": "#2d3748",
    "--border-light": "#263041", "--panel-bg": "#11161d", "--input-bg": "#1b2430",
  } : {
    "--bg": "#f4f6fb", "--card-bg": "#ffffff", "--card-selected": "#edf2ff",
    "--text": "#0f172a", "--text-muted": "#64748b", "--border": "#dbe2ee",
    "--border-light": "#e8edf7", "--panel-bg": "#ffffff", "--input-bg": "#eef3fb",
  };

  const contentWidth = 4200;
  const contentHeight = 3400;

  return (
    <div style={{
      ...vars,
      background: "var(--bg)",
      color: "var(--text)",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />

      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            Schema GTFS
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Trascina le tabelle · zoom/pan · click campo per evidenziare relazioni
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Cerca tabella/campo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: 220,
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontSize: 12,
              padding: "7px 10px",
              outline: "none",
            }}
          />
          <button onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.1).toFixed(2))))} style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, cursor: "pointer", padding: "7px 10px", fontSize: 12 }}>-</button>
          <span style={{ minWidth: 46, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))} style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, cursor: "pointer", padding: "7px 10px", fontSize: 12 }}>+</button>
          <button
            onClick={() => { setPositions(buildAutoLayout()); setPan({ x: 0, y: 0 }); setZoom(0.75); }}
            style={{ background: "#2563eb", border: "1px solid #2563eb", color: "#fff", borderRadius: 8, cursor: "pointer", padding: "7px 12px", fontSize: 12, fontWeight: 600 }}
            title="Organizza automaticamente le tabelle per livello di dipendenza FK"
          >Auto</button>
          <button onClick={() => { setPositions(buildInitialPositions()); setPan({ x: 0, y: 0 }); setZoom(0.95); }} style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, cursor: "pointer", padding: "7px 10px", fontSize: 12 }}>Reset</button>
          <button onClick={() => setDarkMode((d) => !d)} style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, cursor: "pointer", padding: "7px 10px", fontSize: 12 }}>{darkMode ? "Light" : "Dark"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", height: "calc(100vh - 92px)" }}>
        <div
          onPointerDown={handlePointerDownCanvas}
          onPointerMove={handlePointerMove}
          onPointerUp={endInteraction}
          onPointerLeave={endInteraction}
          style={{
            position: "relative",
            overflow: "auto",
            borderRight: "1px solid var(--border)",
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,140,0.16) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        >
          <div style={{
            width: contentWidth,
            height: contentHeight,
            position: "relative",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}>
            <svg width={contentWidth} height={contentHeight} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {allRelations.map((rel, idx) => {
                const from = positions[rel.from];
                const to = positions[rel.to];
                if (!from || !to) return null;
                const fromH = getCardHeight(rel.from);
                const toH = getCardHeight(rel.to);
                const fieldIdx = TABLES[rel.from].fields.findIndex((f) => f.name === rel.field);
                const sx = from.x + CARD_WIDTH;
                const sy = from.y + CARD_HEADER + fieldIdx * FIELD_ROW + FIELD_ROW / 2;
                const tx = to.x;
                const ty = to.y + CARD_HEADER + toH * 0.35;

                const lit = selectedField
                  ? (rel.from === selectedField.table && rel.field === selectedField.field) ||
                    (rel.to === selectedField.table && rel.target === `${selectedField.table}.${selectedField.field}`)
                  : rel.from === selected || rel.to === selected;

                const dim = search && !matchesSearch.has(rel.from) && !matchesSearch.has(rel.to);
                return (
                  <path
                    key={`${rel.from}-${rel.to}-${idx}`}
                    d={buildOrthoPath(sx, sy, tx, ty)}
                    fill="none"
                    stroke={lit ? "#38bdf8" : "#475569"}
                    strokeWidth={lit ? 2.2 : 1}
                    strokeDasharray={lit ? "7 4" : "5 4"}
                    opacity={dim ? 0.12 : lit ? 1 : 0.35}
                  />
                );
              })}
            </svg>

            {Object.entries(TABLES).map(([tableKey, table]) => {
              const p = positions[tableKey];
              if (!p) return null;
              const g = getGroupForTable(tableKey);
              const color = g?.color || "#64748b";
              const selectedCard = tableKey === selected;
              const dim = search && !matchesSearch.has(tableKey);
              return (
                <div
                  key={tableKey}
                  onPointerDown={(e) => handlePointerDownCard(e, tableKey)}
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                    width: CARD_WIDTH,
                    borderRadius: 10,
                    border: `1.5px solid ${selectedCard ? color : "var(--border)"}`,
                    background: selectedCard ? "var(--card-selected)" : "var(--card-bg)",
                    boxShadow: selectedCard ? `0 0 0 3px ${color}22, 0 12px 24px rgba(0,0,0,0.16)` : "0 4px 14px rgba(0,0,0,0.08)",
                    opacity: dim ? 0.25 : 1,
                    cursor: "grab",
                    userSelect: "none",
                  }}
                >
                  <div style={{
                    height: CARD_HEADER,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "0 10px",
                    borderBottom: "1px solid var(--border)",
                    background: `${color}16`,
                  }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 700, color: "var(--text)" }}>
                      {table.label}
                    </span>
                    <span style={{ fontSize: 10, color, fontWeight: 700 }}>
                      {table.required ? "REQ" : "OPT"}
                    </span>
                  </div>
                  <div>
                    {table.fields.map((field, i) => {
                      const isFieldLit =
                        selectedField &&
                        selectedField.table === tableKey &&
                        selectedField.field === field.name;
                      return (
                        <div
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(tableKey);
                            setSelectedField(
                              isFieldLit ? null : { table: tableKey, field: field.name }
                            );
                          }}
                          style={{
                            minHeight: FIELD_ROW,
                            padding: "1px 10px",
                            borderBottom: "1px solid var(--border-light)",
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 11,
                            cursor: "pointer",
                            background: isFieldLit ? "rgba(56,189,248,0.12)" : "transparent",
                            borderLeft: isFieldLit ? "2px solid #38bdf8" : "2px solid transparent",
                          }}
                        >
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color: isFieldLit ? "#38bdf8" : field.fk ? "#60a5fa" : "var(--text)",
                            fontWeight: field.pk ? 700 : 500,
                          }}>
                            {field.pk ? "PK " : ""}{field.name}
                          </span>
                          <TypeBadge type={field.type} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: 14, background: "var(--panel-bg)", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Legenda gruppi */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Legenda colori</div>
            {GROUPS.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: g.color, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text)" }}>{g.label}</span>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                    {g.id === "core" && "Tabelle obbligatorie: definiscono linee, corse, fermate e orari"}
                    {g.id === "geo" && "Percorso geografico (shape) e frequenze tra corse"}
                    {g.id === "fare_v1" && "Tariffe legacy: attributi e regole (GTFS v1)"}
                    {g.id === "fare_v2" && "Tariffe moderne: prodotti, media, aree, reti (GTFS v2)"}
                    {g.id === "access" && "Stazione: percorsi interni, livelli e accessibilità"}
                    {g.id === "flex" && "Servizi a domanda: prenotazioni e gruppi di fermate"}
                    {g.id === "meta" && "Metadati: informazioni sul feed, traduzioni e attribuzioni"}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text)", fontSize: 10 }}>REQ</span> tabella obbligatoria nel feed
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: 10 }}>OPT</span> tabella opzionale
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#60a5fa", fontSize: 10 }}>campo blu</span> chiave esterna (FK)
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text)", fontSize: 10 }}>PK campo</span> chiave primaria
              </div>
            </div>
          </div>
          {selectedTable && (
            <>
              <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: selectedGroup?.color || "#64748b" }} />
                <h2 style={{ margin: 0, fontSize: 16, fontFamily: "'JetBrains Mono', monospace" }}>{selectedTable.label}</h2>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                PK: {selectedTable.pk.length ? selectedTable.pk.join(" + ") : "(nessuna)"}
              </div>
              <div style={{
                border: "1px solid var(--border)",
                background: "var(--card-bg)",
                borderRadius: 10,
                padding: "4px 12px",
              }}>
                {selectedTable.fields.map((field, idx) => (
                  <FieldDetail key={idx} field={field} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}