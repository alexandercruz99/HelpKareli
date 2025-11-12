#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar 296 lecciones base en SpeakLexi 2.0
Usando PyMySQL como conector alternativo
"""

import pymysql
from datetime import datetime
import json
import sys
import os

# ============================================
# CONFIGURACIÓN DE BASE DE DATOS - CON PyMySQL
# ============================================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'loquesea2013',  # Cambiar si tienes password
    'database': 'SpeakLexi2',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# ============================================
# CONFIGURACIÓN DE XP POR NIVEL
# ============================================
XP_POR_NIVEL = {
    'A1': 10,
    'A2': 15,
    'B1': 25,
    'B2': 35,
    'C1': 45,
    'C2': 50
}

# ============================================
# DEFINICIÓN DE LECCIONES POR NIVEL E IDIOMA
# ============================================

# Plantillas de lecciones por nivel (independientes del idioma)
LECCIONES_TEMPLATES = {
    'A1': [
        {
            'titulo': 'El Alfabeto y Pronunciación',
            'duracion': 30,
            'descripcion': 'Aprende el alfabeto y la pronunciación básica',
            'temas': ['alfabeto', 'vocales', 'consonantes', 'pronunciación básica']
        },
        {
            'titulo': 'Saludos y Despedidas',
            'duracion': 35,
            'descripcion': 'Expresiones comunes para saludar y despedirse',
            'temas': ['saludos formales', 'saludos informales', 'despedidas', 'presentaciones']
        },
        {
            'titulo': 'Presentarse en el Idioma',
            'duracion': 40,
            'descripcion': 'Cómo dar información personal básica',
            'temas': ['nombre', 'edad', 'nacionalidad', 'ocupación']
        },
        {
            'titulo': 'Números del 1 al 100',
            'duracion': 35,
            'descripcion': 'Aprende a contar y usar números',
            'temas': ['números cardinales', 'números ordinales', 'contar', 'cantidades']
        },
        {
            'titulo': 'Colores y Formas',
            'duracion': 30,
            'descripcion': 'Vocabulario de colores y formas básicas',
            'temas': ['colores primarios', 'colores secundarios', 'formas geométricas']
        },
        {
            'titulo': 'La Familia',
            'duracion': 40,
            'descripcion': 'Vocabulario sobre miembros de la familia',
            'temas': ['padres', 'hermanos', 'familia extendida', 'relaciones']
        },
        {
            'titulo': 'Días de la Semana y Meses',
            'duracion': 35,
            'descripcion': 'Aprende a hablar sobre fechas y tiempo',
            'temas': ['días de la semana', 'meses del año', 'estaciones', 'fechas']
        },
        {
            'titulo': 'Partes del Cuerpo',
            'duracion': 35,
            'descripcion': 'Vocabulario básico del cuerpo humano',
            'temas': ['cabeza', 'torso', 'extremidades', 'sentidos']
        },
        {
            'titulo': 'Comida y Bebida Básica',
            'duracion': 40,
            'descripcion': 'Vocabulario esencial de alimentos',
            'temas': ['frutas', 'verduras', 'bebidas', 'comidas del día']
        },
        {
            'titulo': 'La Casa y los Muebles',
            'duracion': 40,
            'descripcion': 'Vocabulario sobre habitaciones y muebles',
            'temas': ['habitaciones', 'muebles', 'electrodomésticos', 'objetos del hogar']
        }
    ],
    'A2': [
        {
            'titulo': 'En el Restaurante',
            'duracion': 40,
            'descripcion': 'Vocabulario y frases para pedir comida',
            'temas': ['menú', 'ordenar comida', 'pagar la cuenta', 'preferencias alimenticias']
        },
        {
            'titulo': 'De Compras',
            'duracion': 40,
            'descripcion': 'Cómo comprar en tiendas y mercados',
            'temas': ['precios', 'tallas', 'métodos de pago', 'devoluciones']
        },
        {
            'titulo': 'Transporte Público',
            'duracion': 35,
            'descripcion': 'Cómo moverse por la ciudad',
            'temas': ['autobús', 'metro', 'taxi', 'boletos']
        },
        {
            'titulo': 'En el Hotel',
            'duracion': 40,
            'descripcion': 'Reservar y comunicarse en hoteles',
            'temas': ['reservación', 'check-in', 'servicios', 'quejas']
        },
        {
            'titulo': 'Describir Personas',
            'duracion': 35,
            'descripcion': 'Vocabulario para describir apariencia y personalidad',
            'temas': ['apariencia física', 'características', 'personalidad', 'ropa']
        },
        {
            'titulo': 'El Tiempo y el Clima',
            'duracion': 30,
            'descripcion': 'Hablar sobre el clima y las estaciones',
            'temas': ['temperatura', 'fenómenos climáticos', 'estaciones', 'pronóstico']
        },
        {
            'titulo': 'Pasatiempos y Hobbies',
            'duracion': 40,
            'descripcion': 'Hablar sobre actividades de ocio',
            'temas': ['deportes', 'música', 'lectura', 'actividades recreativas']
        },
        {
            'titulo': 'En el Médico',
            'duracion': 45,
            'descripcion': 'Vocabulario médico básico y síntomas',
            'temas': ['síntomas', 'partes del cuerpo', 'medicamentos', 'citas médicas']
        },
        {
            'titulo': 'Direcciones y Ubicaciones',
            'duracion': 35,
            'descripcion': 'Cómo dar y pedir direcciones',
            'temas': ['orientación', 'lugares públicos', 'instrucciones', 'distancias']
        },
        {
            'titulo': 'Rutina Diaria',
            'duracion': 40,
            'descripcion': 'Hablar sobre actividades cotidianas',
            'temas': ['horarios', 'actividades diarias', 'frecuencia', 'hábitos']
        },
        {
            'titulo': 'Pasado Simple',
            'duracion': 45,
            'descripcion': 'Hablar sobre eventos pasados',
            'temas': ['verbos regulares', 'verbos irregulares', 'expresiones de tiempo pasado']
        },
        {
            'titulo': 'Planes Futuros',
            'duracion': 40,
            'descripcion': 'Expresar intenciones y planes',
            'temas': ['futuro simple', 'expresiones de tiempo futuro', 'predicciones']
        }
    ],
    'B1': [
        {
            'titulo': 'Expresar Opiniones',
            'duracion': 40,
            'descripcion': 'Cómo dar tu opinión de manera efectiva',
            'temas': ['frases de opinión', 'acuerdo/desacuerdo', 'argumentación básica']
        },
        {
            'titulo': 'Hacer Sugerencias',
            'duracion': 35,
            'descripcion': 'Vocabulario para sugerir y proponer ideas',
            'temas': ['propuestas', 'invitaciones', 'aceptar/rechazar', 'alternativas']
        },
        {
            'titulo': 'Narrar Historias',
            'duracion': 45,
            'descripcion': 'Estructuras para contar eventos',
            'temas': ['secuencia temporal', 'conectores narrativos', 'descripciones']
        },
        {
            'titulo': 'Comparaciones',
            'duracion': 40,
            'descripcion': 'Comparar personas, lugares y cosas',
            'temas': ['comparativo', 'superlativo', 'igualdad', 'diferencias']
        },
        {
            'titulo': 'Condicionales',
            'duracion': 45,
            'descripcion': 'Expresar situaciones hipotéticas',
            'temas': ['primer condicional', 'segundo condicional', 'probabilidad']
        },
        {
            'titulo': 'En el Trabajo',
            'duracion': 45,
            'descripcion': 'Vocabulario profesional básico',
            'temas': ['entrevistas', 'responsabilidades', 'colegas', 'reuniones']
        },
        {
            'titulo': 'Tecnología y Medios',
            'duracion': 40,
            'descripcion': 'Vocabulario sobre tecnología moderna',
            'temas': ['dispositivos', 'internet', 'redes sociales', 'aplicaciones']
        },
        {
            'titulo': 'Viajes y Turismo',
            'duracion': 45,
            'descripcion': 'Planificar y hablar sobre viajes',
            'temas': ['destinos', 'transporte', 'alojamiento', 'actividades turísticas']
        },
        {
            'titulo': 'Cultura y Tradiciones',
            'duracion': 40,
            'descripcion': 'Hablar sobre costumbres y celebraciones',
            'temas': ['festividades', 'costumbres locales', 'comida tradicional', 'celebraciones']
        },
        {
            'titulo': 'Medio Ambiente',
            'duracion': 45,
            'descripcion': 'Vocabulario sobre ecología y naturaleza',
            'temas': ['reciclaje', 'contaminación', 'conservación', 'cambio climático']
        },
        {
            'titulo': 'Educación y Aprendizaje',
            'duracion': 40,
            'descripcion': 'Vocabulario académico',
            'temas': ['estudios', 'exámenes', 'materias', 'métodos de estudio']
        },
        {
            'titulo': 'Deportes y Fitness',
            'duracion': 35,
            'descripcion': 'Hablar sobre actividad física',
            'temas': ['deportes populares', 'ejercicio', 'competiciones', 'salud física']
        },
        {
            'titulo': 'Medios de Comunicación',
            'duracion': 40,
            'descripcion': 'Vocabulario sobre noticias y medios',
            'temas': ['periódicos', 'televisión', 'radio', 'periodismo']
        },
        {
            'titulo': 'Solicitudes y Quejas',
            'duracion': 40,
            'descripcion': 'Cómo hacer peticiones y expresar insatisfacción',
            'temas': ['lenguaje formal', 'reclamaciones', 'soluciones', 'disculpas']
        },
        {
            'titulo': 'Voz Pasiva',
            'duracion': 45,
            'descripcion': 'Uso y formación de la voz pasiva',
            'temas': ['estructura pasiva', 'agente', 'usos formales', 'transformaciones']
        }
    ],
    'B2': [
        {
            'titulo': 'Emails Profesionales',
            'duracion': 45,
            'descripcion': 'Cómo redactar correos formales',
            'temas': ['estructura formal', 'saludos profesionales', 'despedidas', 'tono apropiado']
        },
        {
            'titulo': 'Reuniones de Trabajo',
            'duracion': 40,
            'descripcion': 'Frases útiles para participar en reuniones',
            'temas': ['agenda', 'presentaciones', 'acuerdos', 'seguimiento']
        },
        {
            'titulo': 'Negociación',
            'duracion': 45,
            'descripcion': 'Vocabulario para negociar y llegar a acuerdos',
            'temas': ['propuestas', 'contraofertas', 'concesiones', 'acuerdos']
        },
        {
            'titulo': 'Presentaciones Públicas',
            'duracion': 50,
            'descripcion': 'Estructurar y dar presentaciones efectivas',
            'temas': ['introducción', 'cuerpo', 'conclusión', 'manejo de preguntas']
        },
        {
            'titulo': 'Argumentación Avanzada',
            'duracion': 45,
            'descripcion': 'Técnicas para debatir y persuadir',
            'temas': ['tesis', 'evidencia', 'contraargumentos', 'conclusiones']
        },
        {
            'titulo': 'Lenguaje Idiomático',
            'duracion': 40,
            'descripcion': 'Expresiones coloquiales y modismos',
            'temas': ['frases hechas', 'refranes', 'expresiones populares', 'contexto cultural']
        },
        {
            'titulo': 'Entrevistas de Trabajo',
            'duracion': 45,
            'descripcion': 'Preparación para entrevistas profesionales',
            'temas': ['preguntas comunes', 'fortalezas/debilidades', 'experiencia laboral', 'expectativas']
        },
        {
            'titulo': 'Economía y Finanzas',
            'duracion': 45,
            'descripcion': 'Vocabulario económico y financiero',
            'temas': ['mercados', 'inversiones', 'inflación', 'presupuestos']
        },
        {
            'titulo': 'Ciencia y Tecnología',
            'duracion': 45,
            'descripcion': 'Vocabulario técnico y científico',
            'temas': ['innovación', 'investigación', 'descubrimientos', 'metodología']
        },
        {
            'titulo': 'Literatura y Arte',
            'duracion': 40,
            'descripcion': 'Hablar sobre obras literarias y artísticas',
            'temas': ['géneros literarios', 'estilos artísticos', 'crítica', 'análisis']
        },
        {
            'titulo': 'Política y Sociedad',
            'duracion': 45,
            'descripcion': 'Vocabulario sobre temas políticos y sociales',
            'temas': ['gobierno', 'políticas públicas', 'democracia', 'derechos']
        },
        {
            'titulo': 'Salud y Bienestar',
            'duracion': 40,
            'descripcion': 'Vocabulario médico avanzado',
            'temas': ['diagnósticos', 'tratamientos', 'prevención', 'salud mental']
        },
        {
            'titulo': 'Tiempos Perfectos Avanzados',
            'duracion': 50,
            'descripcion': 'Dominio de tiempos perfectos complejos',
            'temas': ['presente perfecto continuo', 'pasado perfecto', 'futuro perfecto']
        },
        {
            'titulo': 'Estilo Indirecto',
            'duracion': 45,
            'descripcion': 'Reportar lo que otros dijeron',
            'temas': ['reported speech', 'cambios de tiempo verbal', 'preguntas indirectas']
        },
        {
            'titulo': 'Conectores Avanzados',
            'duracion': 40,
            'descripcion': 'Conectores para escritura formal',
            'temas': ['contraste', 'causa-efecto', 'secuencia', 'énfasis']
        }
    ],
    'C1': [
        {
            'titulo': 'Escribir Ensayos Argumentativos',
            'duracion': 60,
            'descripcion': 'Estructura y técnicas para ensayos académicos',
            'temas': ['tesis', 'argumentos', 'evidencia', 'conclusiones académicas']
        },
        {
            'titulo': 'Análisis Crítico',
            'duracion': 50,
            'descripcion': 'Evaluar y analizar textos complejos',
            'temas': ['análisis textual', 'interpretación', 'crítica constructiva', 'síntesis']
        },
        {
            'titulo': 'Discurso Académico',
            'duracion': 55,
            'descripcion': 'Lenguaje formal para contextos académicos',
            'temas': ['terminología especializada', 'estructura formal', 'citas', 'referencias']
        },
        {
            'titulo': 'Presentaciones Académicas',
            'duracion': 55,
            'descripcion': 'Presentar investigaciones y proyectos',
            'temas': ['metodología', 'resultados', 'discusión', 'defensa de tesis']
        },
        {
            'titulo': 'Redacción Profesional',
            'duracion': 50,
            'descripcion': 'Escritura avanzada para negocios',
            'temas': ['informes', 'propuestas', 'memorandos', 'documentos legales']
        },
        {
            'titulo': 'Matices del Lenguaje',
            'duracion': 45,
            'descripcion': 'Sutilezas y connotaciones',
            'temas': ['registro formal/informal', 'ironía', 'sarcasmo', 'implicaciones']
        },
        {
            'titulo': 'Filosofía y Ética',
            'duracion': 50,
            'descripcion': 'Vocabulario filosófico y moral',
            'temas': ['dilemas éticos', 'corrientes filosóficas', 'argumentación moral']
        },
        {
            'titulo': 'Investigación y Metodología',
            'duracion': 55,
            'descripcion': 'Vocabulario de investigación científica',
            'temas': ['hipótesis', 'variables', 'análisis de datos', 'conclusiones']
        },
        {
            'titulo': 'Crítica Literaria',
            'duracion': 50,
            'descripcion': 'Análisis profundo de obras literarias',
            'temas': ['simbolismo', 'narrativa', 'personajes', 'temas literarios']
        },
        {
            'titulo': 'Comunicación Intercultural',
            'duracion': 45,
            'descripcion': 'Navegar diferencias culturales',
            'temas': ['etiqueta cultural', 'malentendidos', 'adaptación', 'diplomacia']
        },
        {
            'titulo': 'Estructuras Complejas',
            'duracion': 55,
            'descripcion': 'Gramática avanzada y estilo',
            'temas': ['subordinadas', 'inversión', 'énfasis', 'estructuras sofisticadas']
        },
        {
            'titulo': 'Retórica y Persuasión',
            'duracion': 50,
            'descripcion': 'Técnicas retóricas avanzadas',
            'temas': ['ethos', 'pathos', 'logos', 'falacias lógicas']
        }
    ],
    'C2': [
        {
            'titulo': 'Dominio de Idioms',
            'duracion': 50,
            'descripcion': 'Expresiones idiomáticas como nativo',
            'temas': ['modismos complejos', 'frases hechas', 'expresiones regionales', 'jerga']
        },
        {
            'titulo': 'Sutilezas Pragmáticas',
            'duracion': 45,
            'descripcion': 'Uso apropiado según contexto',
            'temas': ['implicaturas', 'presuposiciones', 'cortesía lingüística', 'inferencias']
        },
        {
            'titulo': 'Variaciones Dialectales',
            'duracion': 50,
            'descripcion': 'Diferencias regionales del idioma',
            'temas': ['acentos', 'vocabulario regional', 'diferencias gramaticales', 'pronunciación']
        },
        {
            'titulo': 'Lenguaje Literario Avanzado',
            'duracion': 55,
            'descripcion': 'Recursos literarios sofisticados',
            'temas': ['metáforas complejas', 'alegorías', 'intertextualidad', 'estilística']
        },
        {
            'titulo': 'Traducción e Interpretación',
            'duracion': 60,
            'descripcion': 'Principios de traducción',
            'temas': ['equivalencia', 'adaptación cultural', 'falsos amigos', 'registro']
        },
        {
            'titulo': 'Lenguaje Especializado',
            'duracion': 55,
            'descripcion': 'Terminología de campos específicos',
            'temas': ['legal', 'médico', 'técnico', 'científico']
        },
        {
            'titulo': 'Humor y Juegos de Palabras',
            'duracion': 45,
            'descripcion': 'Comprender y crear humor',
            'temas': ['doble sentido', 'ironía', 'sarcasmo', 'albures lingüísticos']
        },
        {
            'titulo': 'Registro y Estilo',
            'duracion': 50,
            'descripcion': 'Adaptar el lenguaje al contexto',
            'temas': ['formal', 'informal', 'coloquial', 'técnico', 'poético']
        },
        {
            'titulo': 'Historia del Idioma',
            'duracion': 50,
            'descripcion': 'Evolución y etimología',
            'temas': ['origen de palabras', 'cambios históricos', 'influencias', 'préstamos']
        },
        {
            'titulo': 'Perfeccionamiento Total',
            'duracion': 60,
            'descripcion': 'Pulir habilidades al máximo nivel',
            'temas': ['refinamiento', 'fluidez nativa', 'precisión absoluta', 'maestría completa']
        }
    ]
}

# ============================================
# TRADUCCIONES DE TÍTULOS POR IDIOMA
# ============================================
TRADUCCIONES = {
    'Inglés': {
        'El Alfabeto y Pronunciación': 'The Alphabet and Pronunciation',
        'Saludos y Despedidas': 'Greetings and Farewells',
        'Presentarse en el Idioma': 'Introducing Yourself',
        'Números del 1 al 100': 'Numbers from 1 to 100',
        'Colores y Formas': 'Colors and Shapes',
        'La Familia': 'The Family',
        'Días de la Semana y Meses': 'Days of the Week and Months',
        'Partes del Cuerpo': 'Body Parts',
        'Comida y Bebida Básica': 'Basic Food and Drink',
        'La Casa y los Muebles': 'The House and Furniture',
        'En el Restaurante': 'At the Restaurant',
        'De Compras': 'Shopping',
        'Transporte Público': 'Public Transportation',
        'En el Hotel': 'At the Hotel',
        'Describir Personas': 'Describing People',
        'El Tiempo y el Clima': 'Weather and Climate',
        'Pasatiempos y Hobbies': 'Hobbies and Pastimes',
        'En el Médico': 'At the Doctor',
        'Direcciones y Ubicaciones': 'Directions and Locations',
        'Rutina Diaria': 'Daily Routine',
        'Pasado Simple': 'Simple Past',
        'Planes Futuros': 'Future Plans',
        'Expresar Opiniones': 'Expressing Opinions',
        'Hacer Sugerencias': 'Making Suggestions',
        'Narrar Historias': 'Telling Stories',
        'Comparaciones': 'Comparisons',
        'Condicionales': 'Conditionals',
        'En el Trabajo': 'At Work',
        'Tecnología y Medios': 'Technology and Media',
        'Viajes y Turismo': 'Travel and Tourism',
        'Cultura y Tradiciones': 'Culture and Traditions',
        'Medio Ambiente': 'Environment',
        'Educación y Aprendizaje': 'Education and Learning',
        'Deportes y Fitness': 'Sports and Fitness',
        'Medios de Comunicación': 'Media',
        'Solicitudes y Quejas': 'Requests and Complaints',
        'Voz Pasiva': 'Passive Voice',
        'Emails Profesionales': 'Professional Emails',
        'Reuniones de Trabajo': 'Work Meetings',
        'Negociación': 'Negotiation',
        'Presentaciones Públicas': 'Public Presentations',
        'Argumentación Avanzada': 'Advanced Argumentation',
        'Lenguaje Idiomático': 'Idiomatic Language',
        'Entrevistas de Trabajo': 'Job Interviews',
        'Economía y Finanzas': 'Economy and Finance',
        'Ciencia y Tecnología': 'Science and Technology',
        'Literatura y Arte': 'Literature and Art',
        'Política y Sociedad': 'Politics and Society',
        'Salud y Bienestar': 'Health and Wellness',
        'Tiempos Perfectos Avanzados': 'Advanced Perfect Tenses',
        'Estilo Indirecto': 'Reported Speech',
        'Conectores Avanzados': 'Advanced Connectors',
        'Escribir Ensayos Argumentativos': 'Writing Argumentative Essays',
        'Análisis Crítico': 'Critical Analysis',
        'Discurso Académico': 'Academic Discourse',
        'Presentaciones Académicas': 'Academic Presentations',
        'Redacción Profesional': 'Professional Writing',
        'Matices del Lenguaje': 'Language Nuances',
        'Filosofía y Ética': 'Philosophy and Ethics',
        'Investigación y Metodología': 'Research and Methodology',
        'Crítica Literaria': 'Literary Criticism',
        'Comunicación Intercultural': 'Intercultural Communication',
        'Estructuras Complejas': 'Complex Structures',
        'Retórica y Persuasión': 'Rhetoric and Persuasion',
        'Dominio de Idioms': 'Mastery of Idioms',
        'Sutilezas Pragmáticas': 'Pragmatic Subtleties',
        'Variaciones Dialectales': 'Dialectal Variations',
        'Lenguaje Literario Avanzado': 'Advanced Literary Language',
        'Traducción e Interpretación': 'Translation and Interpretation',
        'Lenguaje Especializado': 'Specialized Language',
        'Humor y Juegos de Palabras': 'Humor and Wordplay',
        'Registro y Estilo': 'Register and Style',
        'Historia del Idioma': 'Language History',
        'Perfeccionamiento Total': 'Total Mastery'
    },
    'Francés': {
        'El Alfabeto y Pronunciación': 'L\'Alphabet et la Prononciation',
        'Saludos y Despedidas': 'Salutations et Adieux',
        'Presentarse en el Idioma': 'Se Présenter',
        'Números del 1 al 100': 'Les Nombres de 1 à 100',
        'Colores y Formas': 'Couleurs et Formes',
        'La Familia': 'La Famille',
        'Días de la Semana y Meses': 'Jours de la Semaine et Mois',
        'Partes del Cuerpo': 'Parties du Corps',
        'Comida y Bebida Básica': 'Nourriture et Boisson de Base',
        'La Casa y los Muebles': 'La Maison et les Meubles',
        'En el Restaurante': 'Au Restaurant',
        'De Compras': 'Faire les Courses',
        'Transporte Público': 'Transports Publics',
        'En el Hotel': 'À l\'Hôtel',
        'Describir Personas': 'Décrire des Personnes',
        'El Tiempo y el Clima': 'Le Temps et le Climat',
        'Pasatiempos y Hobbies': 'Loisirs et Hobbies',
        'En el Médico': 'Chez le Médecin',
        'Direcciones y Ubicaciones': 'Directions et Emplacements',
        'Rutina Diaria': 'Routine Quotidienne',
        'Pasado Simple': 'Passé Simple',
        'Planes Futuros': 'Plans Futurs',
        'Expresar Opiniones': 'Exprimer des Opinions',
        'Hacer Sugerencias': 'Faire des Suggestions',
        'Narrar Historias': 'Raconter des Histoires',
        'Comparaciones': 'Comparaisons',
        'Condicionales': 'Conditionnels',
        'En el Trabajo': 'Au Travail',
        'Tecnología y Medios': 'Technologie et Médias',
        'Viajes y Turismo': 'Voyages et Tourisme',
        'Cultura y Tradiciones': 'Culture et Traditions',
        'Medio Ambiente': 'Environnement',
        'Educación y Aprendizaje': 'Éducation et Apprentissage',
        'Deportes y Fitness': 'Sports et Fitness',
        'Medios de Comunicación': 'Médias',
        'Solicitudes y Quejas': 'Demandes et Plaintes',
        'Voz Pasiva': 'Voix Passive',
        'Emails Profesionales': 'Emails Professionnels',
        'Reuniones de Trabajo': 'Réunions de Travail',
        'Negociación': 'Négociation',
        'Presentaciones Públicas': 'Présentations Publiques',
        'Argumentación Avanzada': 'Argumentation Avancée',
        'Lenguaje Idiomático': 'Langage Idiomatique',
        'Entrevistas de Trabajo': 'Entretiens d\'Embauche',
        'Economía y Finanzas': 'Économie et Finances',
        'Ciencia y Tecnología': 'Science et Technologie',
        'Literatura y Arte': 'Littérature et Art',
        'Política y Sociedad': 'Politique et Société',
        'Salud y Bienestar': 'Santé et Bien-être',
        'Tiempos Perfectos Avanzados': 'Temps Parfaits Avancés',
        'Estilo Indirecto': 'Style Indirect',
        'Conectores Avanzados': 'Connecteurs Avancés',
        'Escribir Ensayos Argumentativos': 'Rédiger des Essais Argumentatifs',
        'Análisis Crítico': 'Analyse Critique',
        'Discurso Académico': 'Discours Académique',
        'Presentaciones Académicas': 'Présentations Académiques',
        'Redacción Profesional': 'Rédaction Professionnelle',
        'Matices del Lenguaje': 'Nuances du Langage',
        'Filosofía y Ética': 'Philosophie et Éthique',
        'Investigación y Metodología': 'Recherche et Méthodologie',
        'Crítica Literaria': 'Critique Littéraire',
        'Comunicación Intercultural': 'Communication Interculturelle',
        'Estructuras Complejas': 'Structures Complexes',
        'Retórica y Persuasión': 'Rhétorique et Persuasion',
        'Dominio de Idioms': 'Maîtrise des Idiomes',
        'Sutilezas Pragmáticas': 'Subtilités Pragmatiques',
        'Variaciones Dialectales': 'Variations Dialectales',
        'Lenguaje Literario Avanzado': 'Langage Littéraire Avancé',
        'Traducción e Interpretación': 'Traduction et Interprétation',
        'Lenguaje Especializado': 'Langage Spécialisé',
        'Humor y Juegos de Palabras': 'Humour et Jeux de Mots',
        'Registro y Estilo': 'Registre et Style',
        'Historia del Idioma': 'Histoire de la Langue',
        'Perfeccionamiento Total': 'Perfectionnement Total'
    },
    'Alemán': {
        'El Alfabeto y Pronunciación': 'Das Alphabet und Aussprache',
        'Saludos y Despedidas': 'Begrüßungen und Verabschiedungen',
        'Presentarse en el Idioma': 'Sich Vorstellen',
        'Números del 1 al 100': 'Zahlen von 1 bis 100',
        'Colores y Formas': 'Farben und Formen',
        'La Familia': 'Die Familie',
        'Días de la Semana y Meses': 'Wochentage und Monate',
        'Partes del Cuerpo': 'Körperteile',
        'Comida y Bebida Básica': 'Grundlegendes Essen und Trinken',
        'La Casa y los Muebles': 'Das Haus und die Möbel',
        'En el Restaurante': 'Im Restaurant',
        'De Compras': 'Einkaufen',
        'Transporte Público': 'Öffentliche Verkehrsmittel',
        'En el Hotel': 'Im Hotel',
        'Describir Personas': 'Menschen Beschreiben',
        'El Tiempo y el Clima': 'Wetter und Klima',
        'Pasatiempos y Hobbies': 'Hobbys und Freizeitaktivitäten',
        'En el Médico': 'Beim Arzt',
        'Direcciones y Ubicaciones': 'Wegbeschreibungen und Orte',
        'Rutina Diaria': 'Tägliche Routine',
        'Pasado Simple': 'Einfache Vergangenheit',
        'Planes Futuros': 'Zukunftspläne',
        'Expresar Opiniones': 'Meinungen Äußern',
        'Hacer Sugerencias': 'Vorschläge Machen',
        'Narrar Historias': 'Geschichten Erzählen',
        'Comparaciones': 'Vergleiche',
        'Condicionales': 'Bedingungssätze',
        'En el Trabajo': 'Bei der Arbeit',
        'Tecnología y Medios': 'Technologie und Medien',
        'Viajes y Turismo': 'Reisen und Tourismus',
        'Cultura y Tradiciones': 'Kultur und Traditionen',
        'Medio Ambiente': 'Umwelt',
        'Educación y Aprendizaje': 'Bildung und Lernen',
        'Deportes y Fitness': 'Sport und Fitness',
        'Medios de Comunicación': 'Medien',
        'Solicitudes y Quejas': 'Anfragen und Beschwerden',
        'Voz Pasiva': 'Passiv',
        'Emails Profesionales': 'Professionelle E-Mails',
        'Reuniones de Trabajo': 'Arbeitstreffen',
        'Negociación': 'Verhandlung',
        'Presentaciones Públicas': 'Öffentliche Präsentationen',
        'Argumentación Avanzada': 'Fortgeschrittene Argumentation',
        'Lenguaje Idiomático': 'Idiomatische Sprache',
        'Entrevistas de Trabajo': 'Vorstellungsgespräche',
        'Economía y Finanzas': 'Wirtschaft und Finanzen',
        'Ciencia y Tecnología': 'Wissenschaft und Technologie',
        'Literatura y Arte': 'Literatur und Kunst',
        'Política y Sociedad': 'Politik und Gesellschaft',
        'Salud y Bienestar': 'Gesundheit und Wohlbefinden',
        'Tiempos Perfectos Avanzados': 'Fortgeschrittene Perfektzeiten',
        'Estilo Indirecto': 'Indirekte Rede',
        'Conectores Avanzados': 'Fortgeschrittene Konnektoren',
        'Escribir Ensayos Argumentativos': 'Argumentative Essays Schreiben',
        'Análisis Crítico': 'Kritische Analyse',
        'Discurso Académico': 'Akademischer Diskurs',
        'Presentaciones Académicas': 'Akademische Präsentationen',
        'Redacción Profesional': 'Professionelles Schreiben',
        'Matices del Lenguaje': 'Sprachnuancen',
        'Filosofía y Ética': 'Philosophie und Ethik',
        'Investigación y Metodología': 'Forschung und Methodik',
        'Crítica Literaria': 'Literaturkritik',
        'Comunicación Intercultural': 'Interkulturelle Kommunikation',
        'Estructuras Complejas': 'Komplexe Strukturen',
        'Retórica y Persuasión': 'Rhetorik und Überzeugung',
        'Dominio de Idioms': 'Beherrschung von Redewendungen',
        'Sutilezas Pragmáticas': 'Pragmatische Feinheiten',
        'Variaciones Dialectales': 'Dialektale Variationen',
        'Lenguaje Literario Avanzado': 'Fortgeschrittene Literatursprache',
        'Traducción e Interpretación': 'Übersetzung und Dolmetschen',
        'Lenguaje Especializado': 'Fachsprache',
        'Humor y Juegos de Palabras': 'Humor und Wortspiele',
        'Registro y Estilo': 'Register und Stil',
        'Historia del Idioma': 'Sprachgeschichte',
        'Perfeccionamiento Total': 'Vollständige Perfektion'
    },
    'Italiano': {
        'El Alfabeto y Pronunciación': 'L\'Alfabeto e la Pronuncia',
        'Saludos y Despedidas': 'Saluti e Addii',
        'Presentarse en el Idioma': 'Presentarsi',
        'Números del 1 al 100': 'Numeri da 1 a 100',
        'Colores y Formas': 'Colori e Forme',
        'La Familia': 'La Famiglia',
        'Días de la Semana y Meses': 'Giorni della Settimana e Mesi',
        'Partes del Cuerpo': 'Parti del Corpo',
        'Comida y Bebida Básica': 'Cibo e Bevande di Base',
        'La Casa y los Muebles': 'La Casa e i Mobili',
        'En el Restaurante': 'Al Ristorante',
        'De Compras': 'Fare Shopping',
        'Transporte Público': 'Trasporti Pubblici',
        'En el Hotel': 'In Albergo',
        'Describir Personas': 'Descrivere Persone',
        'El Tiempo y el Clima': 'Il Tempo e il Clima',
        'Pasatiempos y Hobbies': 'Passatempi e Hobby',
        'En el Médico': 'Dal Medico',
        'Direcciones y Ubicaciones': 'Indicazioni e Luoghi',
        'Rutina Diaria': 'Routine Quotidiana',
        'Pasado Simple': 'Passato Semplice',
        'Planes Futuros': 'Piani Futuri',
        'Expresar Opiniones': 'Esprimere Opinioni',
        'Hacer Sugerencias': 'Fare Suggerimenti',
        'Narrar Historias': 'Raccontare Storie',
        'Comparaciones': 'Confronti',
        'Condicionales': 'Condizionali',
        'En el Trabajo': 'Al Lavoro',
        'Tecnología y Medios': 'Tecnologia e Media',
        'Viajes y Turismo': 'Viaggi e Turismo',
        'Cultura y Tradiciones': 'Cultura e Tradizioni',
        'Medio Ambiente': 'Ambiente',
        'Educación y Aprendizaje': 'Educazione e Apprendimento',
        'Deportes y Fitness': 'Sport e Fitness',
        'Medios de Comunicación': 'Media',
        'Solicitudes y Quejas': 'Richieste e Reclami',
        'Voz Pasiva': 'Forma Passiva',
        'Emails Profesionales': 'Email Professionali',
        'Reuniones de Trabajo': 'Riunioni di Lavoro',
        'Negociación': 'Negoziazione',
        'Presentaciones Públicas': 'Presentazioni Pubbliche',
        'Argumentación Avanzada': 'Argomentazione Avanzata',
        'Lenguaje Idiomático': 'Linguaggio Idiomatico',
        'Entrevistas de Trabajo': 'Colloqui di Lavoro',
        'Economía y Finanzas': 'Economia e Finanza',
        'Ciencia y Tecnología': 'Scienza e Tecnologia',
        'Literatura y Arte': 'Letteratura e Arte',
        'Política y Sociedad': 'Politica e Società',
        'Salud y Bienestar': 'Salute e Benessere',
        'Tiempos Perfectos Avanzados': 'Tempi Perfetti Avanzati',
        'Estilo Indirecto': 'Discorso Indiretto',
        'Conectores Avanzados': 'Connettori Avanzati',
        'Escribir Ensayos Argumentativos': 'Scrivere Saggi Argomentativi',
        'Análisis Crítico': 'Analisi Critica',
        'Discurso Académico': 'Discorso Accademico',
        'Presentaciones Académicas': 'Presentazioni Accademiche',
        'Redacción Profesional': 'Scrittura Professionale',
        'Matices del Lenguaje': 'Sfumature del Linguaggio',
        'Filosofía y Ética': 'Filosofia ed Etica',
        'Investigación y Metodología': 'Ricerca e Metodologia',
        'Crítica Literaria': 'Critica Letteraria',
        'Comunicación Intercultural': 'Comunicazione Interculturale',
        'Estructuras Complejas': 'Strutture Complesse',
        'Retórica y Persuasión': 'Retorica e Persuasione',
        'Dominio de Idioms': 'Padronanza dei Modi di Dire',
        'Sutilezas Pragmáticas': 'Sottigliezze Pragmatiche',
        'Variaciones Dialectales': 'Variazioni Dialettali',
        'Lenguaje Literario Avanzado': 'Linguaggio Letterario Avanzato',
        'Traducción e Interpretación': 'Traduzione e Interpretazione',
        'Lenguaje Especializado': 'Linguaggio Specializzato',
        'Humor y Juegos de Palabras': 'Umorismo e Giochi di Parole',
        'Registro y Estilo': 'Registro e Stile',
        'Historia del Idioma': 'Storia della Lingua',
        'Perfeccionamiento Total': 'Perfezionamento Totale'
    }
}

# ============================================
# FUNCIONES PRINCIPALES
# ============================================

def conectar_bd():
    """Conectar a la base de datos MySQL usando PyMySQL"""
    try:
        conexion = pymysql.connect(**DB_CONFIG)
        print("✅ Conexión exitosa a la base de datos")
        return conexion
    except Exception as e:
        print(f"❌ Error al conectar a la base de datos: {e}")
        sys.exit(1)

def obtener_creador_id(cursor):
    """Obtener ID de un usuario admin o profesor para asignar como creador"""
    try:
        cursor.execute("SELECT id FROM usuarios WHERE rol IN ('profesor', 'admin') LIMIT 1")
        resultado = cursor.fetchone()
        if resultado:
            return resultado['id']  # PyMySQL devuelve diccionarios
        else:
            # Si no hay usuarios, crear uno temporal
            print("⚠️  No se encontraron usuarios, creando usuario temporal...")
            cursor.execute(
                "INSERT INTO usuarios (nombre, email, password, rol, estado, creado_en) VALUES (%s, %s, %s, %s, %s, %s)",
                ('Admin Temporal', 'admin@temp.com', 'temp123', 'profesor', 'activo', datetime.now())
            )
            return cursor.lastrowid
    except Exception as e:
        print(f"❌ Error al obtener creador: {e}")
        return 1  # Usar ID 1 como fallback

def traducir_titulo(titulo_original, idioma):
    """Traducir el título de la lección al idioma correspondiente"""
    if idioma in TRADUCCIONES and titulo_original in TRADUCCIONES[idioma]:
        return TRADUCCIONES[idioma][titulo_original]
    return titulo_original

def generar_contenido_leccion(template, nivel, idioma):
    """Generar el contenido JSON de una lección"""
    contenido = {
        "descripcion": template['descripcion'],
        "temas": template['temas'],
        "nivel": nivel,
        "idioma": idioma,
        "xp_otorgado": XP_POR_NIVEL[nivel],
        "teoria": {
            "introduccion": f"En esta lección de nivel {nivel} aprenderás sobre {template['temas'][0]}.",
            "objetivos": [f"Dominar {tema}" for tema in template['temas']],
            "vocabulario_clave": template['temas']
        },
        "actividades": [
            {
                "tipo": "lectura",
                "contenido": f"Contenido de lectura sobre {template['temas'][0]}"
            },
            {
                "tipo": "ejercicio", 
                "contenido": f"Ejercicios prácticos de {template['temas'][1] if len(template['temas']) > 1 else template['temas'][0]}"
            }
        ]
    }
    return json.dumps(contenido, ensure_ascii=False)

def insertar_leccion(cursor, leccion_data):
    """Insertar una lección en la base de datos"""
    query = """
        INSERT INTO lecciones (
            titulo, descripcion, contenido, nivel, idioma,
            duracion_minutos, orden, estado, creado_por
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, leccion_data)
    return cursor.lastrowid

def main():
    """Función principal"""
    print("=" * 60)
    print("🎓 GENERADOR DE LECCIONES BASE - SPEAKLEXI 2.0")
    print("=" * 60)
    print()
    
    # Conectar a BD
    conexion = conectar_bd()
    cursor = conexion.cursor()
    
    # Obtener ID del creador
    creador_id = obtener_creador_id(cursor)
    if conexion.open:
        conexion.commit()  # Commit si se creó usuario temporal
    print(f"👤 Usuario creador: ID {creador_id}")
    print()
    
    # Estadísticas
    idiomas = ['Inglés', 'Francés', 'Alemán', 'Italiano']
    niveles = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    
    total_lecciones = sum(len(LECCIONES_TEMPLATES[nivel]) for nivel in niveles)
    total_general = total_lecciones * len(idiomas)
    
    print(f"📊 Se crearán {total_general} lecciones:")
    print(f"   • {len(idiomas)} idiomas: {', '.join(idiomas)}")
    print(f"   • {len(niveles)} niveles: {', '.join(niveles)}")
    print(f"   • {total_lecciones} lecciones por idioma")
    print()
    
    # Confirmar
    respuesta = input("¿Deseas continuar? (s/n): ")
    if respuesta.lower() != 's':
        print("❌ Operación cancelada")
        conexion.close()
        sys.exit(0)
    
    print()
    print("🚀 Iniciando generación de lecciones...")
    print()
    
    contador = 0
    lecciones_por_idioma = {idioma: 0 for idioma in idiomas}
    
    try:
        for idioma in idiomas:
            print(f"🌍 Generando lecciones para {idioma}...")
            
            for nivel in niveles:
                templates = LECCIONES_TEMPLATES[nivel]
                print(f"   📚 Nivel {nivel}: {len(templates)} lecciones")
                
                for orden, template in enumerate(templates, start=1):
                    # Traducir título
                    titulo_traducido = traducir_titulo(template['titulo'], idioma)
                    
                    # Generar contenido
                    contenido_json = generar_contenido_leccion(template, nivel, idioma)
                    
                    # Preparar datos
                    leccion_data = (
                        titulo_traducido,
                        template['descripcion'],
                        contenido_json,
                        nivel,
                        idioma,
                        template['duracion'],
                        orden,
                        'activa',
                        creador_id
                    )
                    
                    # Insertar
                    leccion_id = insertar_leccion(cursor, leccion_data)
                    contador += 1
                    lecciones_por_idioma[idioma] += 1
                    
                    # Mostrar progreso cada 10 lecciones
                    if contador % 10 == 0:
                        print(f"      ✓ {contador}/{total_general} lecciones creadas...")
            
            print(f"   ✅ {idioma}: {lecciones_por_idioma[idioma]} lecciones completadas")
            print()
        
        # Commit
        conexion.commit()
        
        print()
        print("=" * 60)
        print("🎉 ¡GENERACIÓN COMPLETADA!")
        print("=" * 60)
        print(f"✅ Total de lecciones creadas: {contador}")
        print()
        print("📊 Resumen por idioma:")
        for idioma, cantidad in lecciones_por_idioma.items():
            print(f"   • {idioma}: {cantidad} lecciones")
        print()
        print("🔍 Verifica las lecciones en tu base de datos:")
        print("   SELECT nivel, idioma, COUNT(*) as total")
        print("   FROM lecciones")
        print("   GROUP BY nivel, idioma")
        print("   ORDER BY nivel, idioma;")
        print()
        
    except Exception as e:
        print(f"❌ Error durante la inserción: {e}")
        conexion.rollback()
        sys.exit(1)
    
    finally:
        cursor.close()
        conexion.close()
        print("🔌 Conexión a BD cerrada")

if __name__ == "__main__":
    main()