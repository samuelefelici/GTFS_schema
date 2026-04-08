import { useState, useMemo } from "react";

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

export default function GTFSSchema() {
  const [selected, setSelected] = useState("agency");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [showOnlyConnected, setShowOnlyConnected] = useState(false);
  const [graphZoom, setGraphZoom] = useState(1);

  const filteredTables = useMemo(() => {
    let entries = Object.entries(TABLES);
    if (filter !== "all") {
      const group = GROUPS.find(g => g.id === filter);
      if (group) entries = entries.filter(([k]) => group.tables.includes(k));
    }
    if (search) {
      const s = search.toLowerCase();
      entries = entries.filter(([k, t]) =>
        t.label.toLowerCase().includes(s) ||
        t.fields.some(f => f.name.toLowerCase().includes(s) || f.desc.toLowerCase().includes(s))
      );
    }
    return entries;
  }, [filter, search]);

  const selectedTable = TABLES[selected];
  const selectedGroup = getGroupForTable(selected);

  const allRelations = useMemo(() => {
    const map = new Map();
    Object.entries(TABLES).forEach(([fromTable, table]) => {
      table.fields.forEach((field) => {
        if (!field.fk) return;
        const toTable = field.fk.split(".")[0];
        if (!TABLES[toTable]) return;
        const relKey = `${fromTable}->${toTable}`;
        if (!map.has(relKey)) {
          map.set(relKey, {
            from: fromTable,
            to: toTable,
            fields: [field.name],
          });
        } else {
          map.get(relKey).fields.push(field.name);
        }
      });
    });
    return Array.from(map.values());
  }, []);

  const fkRelations = useMemo(() => {
    if (!selectedTable) return [];
    return selectedTable.fields.filter(f => f.fk).map(f => {
      const targetTable = f.fk.split(".")[0];
      return { from: selected, to: targetTable, field: f.name, target: f.fk };
    });
  }, [selected, selectedTable]);

  const incomingRelations = useMemo(() => {
    const rels = [];
    Object.entries(TABLES).forEach(([k, t]) => {
      t.fields.forEach(f => {
        if (f.fk) {
          const target = f.fk.split(".")[0];
          if (target === selected && k !== selected) {
            rels.push({ from: k, field: f.name, target: f.fk });
          }
        }
      });
    });
    return rels;
  }, [selected]);

  const vars = darkMode ? {
    "--bg": "#0f1117", "--card-bg": "#181b24", "--card-selected": "#1e2230",
    "--text": "#e2e8f0", "--text-muted": "#94a3b8", "--border": "#2d3348",
    "--border-light": "#252b3b", "--panel-bg": "#14161e", "--input-bg": "#1a1d27",
  } : {
    "--bg": "#f8f9fc", "--card-bg": "#ffffff", "--card-selected": "#f0f4ff",
    "--text": "#1e293b", "--text-muted": "#64748b", "--border": "#e2e8f0",
    "--border-light": "#f1f5f9", "--panel-bg": "#ffffff", "--input-bg": "#f1f5f9",
  };

  return (
    <div style={{
      ...vars, background: "var(--bg)", color: "var(--text)", minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
            <span style={{ color: "#3b82f6" }}>GTFS</span> Guida Struttura Dati
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {Object.keys(TABLES).length} tabelle · schema relazionale interattivo completo
          </p>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} style={{
          background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "6px 14px", color: "var(--text)", cursor: "pointer", fontSize: 12
        }}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ padding: "12px 24px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text" placeholder="Cerca tabella o campo..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "6px 12px", color: "var(--text)", fontSize: 12, width: 200, outline: "none"
          }}
        />
        <button
          onClick={() => setFilter("all")}
          style={{
            background: filter === "all" ? "#3b82f6" : "var(--input-bg)",
            color: filter === "all" ? "#fff" : "var(--text-muted)",
            border: "1px solid " + (filter === "all" ? "#3b82f6" : "var(--border)"),
            borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600
          }}
        >Tutte</button>
        {GROUPS.map(g => (
          <button key={g.id} onClick={() => setFilter(g.id)} style={{
            background: filter === g.id ? g.color : "var(--input-bg)",
            color: filter === g.id ? "#fff" : "var(--text-muted)",
            border: `1px solid ${filter === g.id ? g.color : "var(--border)"}`,
            borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 500
          }}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", gap: 0, height: "calc(100vh - 140px)" }}>
        {/* Left: Table grid */}
        <div style={{
          flex: "0 0 340px", overflowY: "auto", padding: "8px 16px 24px",
          borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6
        }}>
          {filteredTables.map(([key, table]) => {
            const g = getGroupForTable(key);
            return (
              <TableCard
                key={key} tableKey={key} table={table}
                isSelected={selected === key}
                onClick={() => setSelected(key)}
                groupColor={g?.color || "#64748b"}
              />
            );
          })}
          {filteredTables.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>
              Nessuna tabella trovata
            </div>
          )}
        </div>

        {/* Right: Detail panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 40px" }}>
          <div style={{
            background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 10,
            padding: "12px 14px", marginBottom: 14
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Come leggere GTFS in 4 passi</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              1) agency definisce l'operatore. 2) routes descrive le linee. 3) trips definisce ogni corsa per giorno/servizio.
              4) stop_times collega le corse alle fermate (stops) con orari e sequenza.
            </div>
          </div>

          <div style={{
            background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 10,
            padding: "12px 14px", marginBottom: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Schema Relazioni (tutte le FK)</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {allRelations.length} connessioni tabella-tabella · click su un nodo per aprire il dettaglio
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowOnlyConnected(v => !v)}
                  style={{
                    background: showOnlyConnected ? "#0ea5e9" : "var(--input-bg)",
                    color: showOnlyConnected ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${showOnlyConnected ? "#0ea5e9" : "var(--border)"}`,
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Solo collegate
                </button>
                <button
                  onClick={() => setGraphZoom(z => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
                  style={{
                    background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 6,
                    padding: "4px 8px", fontSize: 11, color: "var(--text)", cursor: "pointer"
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: 11, minWidth: 40, textAlign: "center", color: "var(--text-muted)" }}>
                  {Math.round(graphZoom * 100)}%
                </span>
                <button
                  onClick={() => setGraphZoom(z => Math.min(1.35, Number((z + 0.1).toFixed(2))))}
                  style={{
                    background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 6,
                    padding: "4px 8px", fontSize: 11, color: "var(--text)", cursor: "pointer"
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <RelationshipGraph
              tables={TABLES}
              groups={GROUPS}
              relations={allRelations}
              selected={selected}
              onSelect={setSelected}
              showOnlyConnected={showOnlyConnected}
              zoom={graphZoom}
            />
          </div>

          {selectedTable && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: selectedGroup?.color, boxShadow: `0 0 10px ${selectedGroup?.color}44`
                }} />
                <h2 style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700 }}>
                  {selectedTable.label}
                </h2>
                {selectedTable.required && (
                  <span style={{
                    fontSize: 10, background: `${selectedGroup?.color}22`, color: selectedGroup?.color,
                    padding: "2px 8px", borderRadius: 4, fontWeight: 700
                  }}>REQUIRED</span>
                )}
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                <strong>Primary Key:</strong>{" "}
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedTable.pk.length === 0 ? "(nessuna — singolo record)" : selectedTable.pk.join(" + ")}
                </span>
              </div>

              {/* Relations summary */}
              {(fkRelations.length > 0 || incomingRelations.length > 0) && (
                <div style={{
                  background: "var(--input-bg)", borderRadius: 8, padding: "10px 14px",
                  marginBottom: 16, border: "1px solid var(--border)", fontSize: 12
                }}>
                  {fkRelations.length > 0 && (
                    <div style={{ marginBottom: incomingRelations.length > 0 ? 6 : 0 }}>
                      <span style={{ color: "#6366f1", fontWeight: 600 }}>Riferimenti in uscita:</span>{" "}
                      {fkRelations.map((r, i) => (
                        <span key={i}>
                          <span
                            style={{ fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#6366f133" }}
                            onClick={() => setSelected(r.to)}
                          >{r.field} → {r.target}</span>
                          {i < fkRelations.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {incomingRelations.length > 0 && (
                    <div>
                      <span style={{ color: "#10b981", fontWeight: 600 }}>Riferimenti in entrata:</span>{" "}
                      {incomingRelations.map((r, i) => (
                        <span key={i}>
                          <span
                            style={{ fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#10b98133" }}
                            onClick={() => setSelected(r.from)}
                          >{TABLES[r.from]?.label}.{r.field}</span>
                          {i < incomingRelations.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fields */}
              <div style={{
                background: "var(--card-bg)", borderRadius: 10, border: "1px solid var(--border)",
                padding: "4px 16px"
              }}>
                {selectedTable.fields.map((f, i) => (
                  <FieldDetail key={i} field={f} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}