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

const TABLE_GUIDES = {
  agency: "Il punto di partenza di ogni feed GTFS. Rappresenta l'ente che gestisce il servizio di trasporto. Se il dataset include più operatori (es. un consorzio), ogni riga identifica un'agenzia distinta: in quel caso agency_id diventa obbligatorio perché le linee in routes devono dichiarare a chi appartengono. I campi minimi richiesti sono agency_name, agency_url e agency_timezone (usa i nomi IANA, es. Europe/Rome).",
  stops: "La tabella più articolata del nucleo GTFS. Tramite location_type non descrive solo le fermate fisiche (tipo 0), ma anche stazioni/hub (1), ingressi (2), nodi di trasferimento interni (3) e aree di imbarco sui binari (4). La relazione padre-figlio con parent_station costruisce la gerarchia di una stazione complessa con più ingressi. Le coordinate WGS84 (stop_lat/stop_lon) sono obbligatorie per le fermate fisiche; wheelchair_boarding è essenziale per soddisfare i requisiti di accessibilità.",
  routes: "Definisce le linee di trasporto. route_type è il campo chiave: usa i codici GTFS standard (0=Tram, 1=Metro, 2=Treno, 3=Bus, 4=Traghetto…) o i codici estesi per servizi speciali. I colori route_color e route_text_color sono usati dalle app di navigazione per la visualizzazione sulla mappa. Se il feed ha più agenzie, compila sempre agency_id. Con GTFS Fare v2, usa network_id per collegare la linea alla rete tariffaria.",
  trips: "Il cuore operativo di GTFS: ogni riga è una singola esecuzione di una linea in un dato giorno. Il link con service_id (via calendar o calendar_dates) stabilisce quando la corsa è attiva. trip_headsign è il testo del cartello sul veicolo (es. 'Milano Centrale'). block_id modella veicoli che continuano su più corse consecutive senza tornare in deposito. Abbina sempre shape_id per tracciare il percorso geografico sulla mappa.",
  stop_times: "La tabella più grande di qualsiasi feed GTFS reale: contiene gli orari di ogni fermata per ogni corsa. Gli orari possono superare le 24:00 per i servizi notturni (es. 25:30:00). timepoint=1 indica fermate con orario garantito (capolinea, nodi principali), timepoint=0 orari approssimati. shape_dist_traveled abilita l'interpolazione precisa della posizione del veicolo nei sistemi real-time. Usa pickup_type e drop_off_type per gestire fermate a salita o discesa esclusa.",
  calendar: "Definisce il calendario settimanale di un servizio con un intervallo di date valido. Ogni flag (0/1) indica se il servizio è attivo in quel giorno. È il modo più semplice per descrivere servizi regolari feriali o festivi. Per eccezioni (festività, servizi straordinari) integra con calendar_dates, che ha sempre la precedenza. Non è obbligatorio se usi esclusivamente calendar_dates per tutte le date.",
  calendar_dates: "Gestisce le eccezioni al calendario: exception_type=1 aggiunge un servizio in una data specifica, exception_type=2 lo rimuove (es. festività). Può essere usato da solo senza calendar, elencando esplicitamente ogni data attiva — utile per feed stagionali o a bassa frequenza. Quando coesiste con calendar, le righe in questo file sovrascrivono sempre i flag settimanali per quella data.",
  shapes: "Descrive la geometria geografica del percorso del veicolo come sequenza ordinata di punti lat/lon. Si collega a trips tramite shape_id. shape_dist_traveled (distanza cumulativa dall'inizio dello shape) è opzionale ma fondamentale per i sistemi GTFS-Realtime: consente di interpolare con precisione la posizione del veicolo lungo la rotta. Verifica sempre che i punti dello shape seguano fedelmente la strada reale percorsa dal mezzo.",
  frequencies: "Alternativa a stop_times per servizi a intervallo regolare (es. metro ogni 3 minuti). Invece di elencare ogni singola corsa, si definisce una finestra oraria con headway_secs (intervallo in secondi). Con exact_times=0 gli orari sono approssimati; con exact_times=1 il sistema calcola orari precisi moltiplicando l'headway dalla start_time. Importante: non usare lo stesso trip_id sia in stop_times sia in frequencies.",
  transfers: "Definisce regole esplicite di interscambio tra fermate, linee o corse. transfer_type=1 garantisce un interscambio temporizzato (il secondo mezzo aspetta il primo). I tipi 4 (in-seat) e 5 (re-board) sono fondamentali per i treni che cambiano numero ma mantengono i passeggeri a bordo. Senza questa tabella, le app di navigazione usano criteri di default (tipicamente 2-5 minuti) per valutare la fattibilità degli interscambi.",
  fare_attributes: "Il sistema tariffario legacy di GTFS v1: definisce classi tariffarie con prezzo fisso, valuta e regole sui trasferimenti inclusi. Semplice da implementare ma limitato: non gestisce abbonamenti, sconti per categoria, media di pagamento diversi o fasce orarie. Per scenari complessi considera GTFS Fare v2. transfer_duration specifica per quanti secondi il biglietto rimane valido per i trasferimenti.",
  fare_rules: "Associa le classi tariffarie di fare_attributes a linee, zone di origine, destinazione e transito. La logica è additiva: se una corsa soddisfa più regole, viene applicata la tariffa più bassa tra quelle corrispondenti. origin_id, destination_id e contains_id fanno riferimento alle zone_id delle fermate in stops. Anche un solo campo è sufficiente per una regola; i campi vuoti fungono da wildcard.",
  fare_media: "Parte di GTFS Fare v2. Descrive il supporto fisico o digitale usato per pagare il biglietto: contanti (0), biglietto cartaceo (1), carta trasporti RFID (2), carta bancaria contactless cEMV (3), app mobile (4). Lo stesso prodotto tariffario può essere disponibile su più media, con prezzi potenzialmente diversi (es. biglietto via app più economico del cartaceo).",
  fare_products: "I prodotti tariffari acquistabili dagli utenti: corsa singola, giornaliero, settimanale, abbonamento mensile, ecc. Il campo amount può essere 0 per trasferimenti gratuiti o negativo per sconti. La chiave primaria è la combinazione fare_product_id + fare_media_id, quindi lo stesso prodotto può avere prezzi diversi a seconda del media. Si collega a rider_categories per tariffe dedicate a fasce di utenza specifiche.",
  rider_categories: "Categorie di passeggeri per le tariffe differenziate: adulto, under-18, anziano, disabile, studente, ecc. Usata insieme a fare_products per gestire sconti e agevolazioni. is_default_fare_category=1 indica la categoria standard (tipicamente adulto), usata dal sistema quando non è specificata altra preferenza. eligibility_url può puntare ai criteri ufficiali di idoneità per ciascuna categoria.",
  fare_leg_rules: "Il motore principale del sistema tariffario v2. Una 'tratta tariffaria' (fare leg) è un segmento continuo di viaggio su una rete. Questa tabella stabilisce quale fare_product è valido in base alla rete (network_id), alle aree di partenza/arrivo e alla fascia oraria (timeframe_group_id). rule_priority risolve i conflitti quando più regole sono applicabili contemporaneamente: vince quella con il valore più alto.",
  fare_transfer_rules: "Estende fare_leg_rules per gestire i costi di trasferimento tra tratte diverse. Definisce se il passaggio da una rete all'altra ha un costo aggiuntivo, se c'è un tempo limite e quanti trasferimenti consecutivi sono coperti dallo stesso prodotto. fare_transfer_type controlla la modalità di calcolo: 0=trasferimento gratuito se già pagato, 1=sconto sul secondo biglietto, 2=costo pieno per ogni tratta.",
  areas: "Le aree tariffarie di GTFS Fare v2, equivalenti concettuali delle zone_id di v1 ma con struttura separata e più flessibile. Un'area raggruppa un insieme di fermate sotto un identificativo comune. Viene usata in fare_leg_rules come from_area_id e to_area_id per determinare la tariffa in base al punto di salita e discesa del passeggero.",
  stop_areas: "Tabella di relazione molti-a-molti tra fermate e aree tariffarie. Una fermata può appartenere a più aree contemporaneamente (es. una stazione di interscambio in zona A e zona B). Questa flessibilità è uno dei principali miglioramenti di Fare v2 rispetto alle zone_id di v1, dove ogni fermata poteva avere una sola zona.",
  networks: "Raggruppa le linee in reti tariffarie (es. 'Rete urbana Milano', 'Rete regionale Lombardia'). Una rete può coprire un'intera città, un bacino o un consorzio di operatori. Le linee vengono associate alle reti tramite route_networks. In alternativa, se ogni linea appartiene a una sola rete, si può usare direttamente network_id nel campo di routes.",
  route_networks: "Tabella di relazione tra linee e reti tariffarie (relazione N:M). Necessaria quando una linea appartiene a più reti oppure quando si preferisce non inserire network_id direttamente in routes. Usata da fare_leg_rules per determinare la rete di appartenenza di una tratta e applicare la tariffa corretta.",
  timeframes: "Fasce orarie per tariffe dinamiche (ore di punta, ore di morbida, notte, weekend…). Si collega a un service_id per gestire variazioni anche in base al giorno della settimana. start_time/end_time usano la stessa sintassi HH:MM:SS di stop_times, con possibilità di superare le 24:00. Viene referenziato in fare_leg_rules tramite from_timeframe_group_id e to_timeframe_group_id.",
  pathways: "Descrive il percorso pedonale all'interno di una stazione: corridoi, scale, scale mobili, ascensori e cancelli. Ogni pathway è un collegamento direzionale tra due punti interni (nodi di tipo 3/4 in stops). traversal_time (in secondi) è fondamentale per il calcolo del tempo di interscambio. max_slope e min_width servono per filtrare percorsi accessibili a persone con mobilità ridotta. Usa is_bidirectional=1 dove possibile per dimezzare le righe.",
  levels: "Livelli verticali di una stazione: piano terra (0), mezzanino (-0.5), piano binari (-1), interrato (-2), ecc. Usato insieme a pathways per la navigazione indoor multi-piano. level_index è un valore numerico arbitrario ma deve essere coerente all'interno della stessa stazione. level_name deve corrispondere alle indicazioni reali della segnaletica (es. 'Mezzanino', 'Banchina ovest').",
  feed_info: "Metadati sul feed GTFS stesso: chi pubblica i dati, in quale lingua, da quando a quando sono validi. feed_publisher_name è l'ente che gestisce la pubblicazione (non necessariamente l'operatore di trasporto). feed_version permette ai sistemi downstream di rilevare aggiornamenti. Questa tabella è obbligatoria se il feed contiene translations. feed_start_date e feed_end_date devono allinearsi con il periodo coperto da calendar.",
  translations: "Localizza qualsiasi campo testuale del feed in più lingue IETF BCP 47. Il meccanismo funziona via record_id (riferimento diretto all'ID del record) o via field_value (match sul valore del campo, utile quando gli ID non sono stabili). Usato principalmente per stop_name e route_long_name in paesi con più lingue ufficiali. La tabella feed_info deve essere presente per poter usare translations.",
  attributions: "Attribuisce il merito di produzione, operazione o gestione dei dati a organizzazioni specifiche, con granularità fino alla singola corsa, linea o agenzia. I ruoli is_producer, is_operator e is_authority (1=sì, 0=no) possono essere cumulativi. Fondamentale per i feed open data dove diversi enti contribuiscono a parti diverse del dataset.",
  location_groups: "Parte di GTFS Flex per i servizi a domanda (demand-responsive transport). Un gruppo di posizioni raccoglie più fermate sotto un identificativo comune: il passeggero può essere prelevato o lasciato in qualsiasi punto del gruppo. Usato in stop_times al posto dei normali stop_id per modellare servizi di tipo dial-a-ride o deviated fixed-route.",
  location_group_stops: "Tabella di relazione molti-a-molti tra gruppi di posizioni e fermate fisiche. Ogni fermata nel gruppo condivide le regole di prenotazione definite nel trip che referenzia quel location_group. Usata insieme a booking_rules per configurare il flusso di prenotazione del servizio a richiesta.",
  booking_rules: "Cuore di GTFS Flex: definisce le regole per prenotare i servizi a domanda. booking_type indica se si può prenotare in tempo reale (0), entro fine giornata (1) o con almeno un giorno di preavviso (2). prior_notice_duration_min/max specificano il preavviso minimo e massimo in minuti. I messaggi (message, pickup_message, drop_off_message) vengono mostrati all'utente nell'app durante la prenotazione.",
  fare_leg_join_rules: "Regola speciale di GTFS Fare v2 per decidere quando trattare due tratte consecutive come una singola tratta ai fini tariffari. Utile per interscambi tra reti diverse in stazioni condivise: se la combinazione from_network_id + to_network_id + fermate di connessione corrisponde, le tratte vengono 'unite' e tariffate come un unico segmento, riducendo il costo apparente dell'interscambio.",
};

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

      {/* ── Barra legenda ── */}
      <div style={{
        padding: "7px 18px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        background: "var(--panel-bg)",
      }}>
        {GROUPS.map((g) => (
          <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500 }}>{g.label}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
          <span><span style={{ color: "#60a5fa", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>campo blu</span> = FK</span>
          <span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text)" }}>PK</span> = chiave primaria</span>
          <span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>REQ</span> / <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-muted)" }}>OPT</span> = obbligatorio / opzionale</span>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", height: "calc(100vh - 130px)" }}>
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
          {selectedTable ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: selectedGroup?.color || "#64748b", flexShrink: 0 }} />
                <h2 style={{ margin: 0, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>{selectedTable.label}</h2>
                <span style={{ fontSize: 10, color: selectedGroup?.color || "#64748b", fontWeight: 700, background: `${selectedGroup?.color || "#64748b"}1a`, padding: "2px 7px", borderRadius: 5 }}>
                  {selectedTable.required ? "REQUIRED" : "OPTIONAL"}
                </span>
              </div>

              {TABLE_GUIDES[selected] && (
                <div style={{
                  background: darkMode ? "rgba(37,99,235,0.09)" : "rgba(37,99,235,0.05)",
                  border: "1px solid rgba(37,99,235,0.22)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 7, color: "#2563eb" }}>
                    Guida alla tabella
                  </div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.75, color: "var(--text-muted)", margin: 0 }}>
                    {TABLE_GUIDES[selected]}
                  </p>
                </div>
              )}

              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text)" }}>Chiave primaria:</strong>{" "}
                {selectedTable.pk.length ? selectedTable.pk.join(" + ") : "(nessuna)"}
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
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", marginTop: 60 }}>
              Clicca una tabella per vedere la guida e i dettagli dei campi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}