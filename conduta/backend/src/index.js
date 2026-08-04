require('./instrument');
const app = require('./app');
const { startNeo4jOutboxProcessor } = require('./jobs/process-neo4j-outbox');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Conduta backend rodando na porta ${PORT}`);
  startNeo4jOutboxProcessor();
});
