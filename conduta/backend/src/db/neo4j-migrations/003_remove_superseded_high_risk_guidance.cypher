// Remove relações de tratamento que foram retiradas da base por risco clínico.
MATCH (d:Diagnostico {nome: 'Taquicardia Supraventricular'})-[r:TRATA_COM]->(m:Medicamento {nome: 'Amiodarona'})
DELETE r;

MATCH (d:Diagnostico {nome: 'AVC Isquêmico'})-[r:TRATA_COM]->(m:Medicamento {nome: 'Rivaroxabana'})
DELETE r;

MATCH (d:Diagnostico {nome: 'Sepse e Choque Séptico'})-[r:TRATA_COM]->(m:Medicamento)
WHERE m.nome IN ['Ceftriaxona', 'Metronidazol']
DELETE r;

MATCH (d:Diagnostico {nome: 'Pneumotórax Espontâneo'})-[r:TRATA_COM]->(m:Medicamento {nome: 'Soro Fisiológico 0,9%'})
DELETE r;

MATCH (d:Diagnostico {nome: 'Sepse e Choque Séptico'})-[r:TEM_RED_FLAG]->(f:RedFlag {descricao: 'Bundle 1h: hemocultura + ATB + lactato + acesso venoso + fluidos'})
DELETE r;

MATCH (d:Diagnostico {nome: 'Intoxicação por Benzodiazepínico'})-[r:TEM_RED_FLAG]->(f:RedFlag {descricao: 'SpO2 < 90% sem resposta ao flumazenil'})
DELETE r;
