# Database Connection Pooling Optimization

BuildBoss używa zaawansowanej konfiguracji Prisma ORM z optymalizacją connection pooling dla maksymalnej wydajności w różnych środowiskach.

## 🔧 Konfiguracja Środowisk

### Development
- **Connection Limit**: 5 połączeń
- **Pool Timeout**: 10 sekund
- **Optymalizacja**: Minimalne zużycie zasobów dla lokalnego developmentu

### Test
- **Connection Limit**: 2 połączenia
- **Pool Timeout**: 5 sekund
- **Optymalizacja**: Szybkie testy z minimalnym overhead

### Production
- **Connection Limit**: 20 połączeń
- **Pool Timeout**: 30 sekund
- **Optymalizacja**: Wysoka przepustowość dla aplikacji produkcyjnej

## 🚀 Funkcje

### 1. Centralized Connection Management
- Jeden globalny Prisma client dla całej aplikacji
- Eliminacja multiple connection pools
- Optymalne wykorzystanie zasobów bazy danych

### 2. Enhanced Logging
- Winston integration dla database events
- Structured logging dla queries, errors, warnings
- Development query debugging z performance metrics

### 3. Query Timeout Protection
```javascript
// Automatyczna ochrona przed długo trwającymi queries
const QUERY_TIMEOUT = 10000; // 10 sekund domyślnie

// Konfiguracja przez environment variable
DB_QUERY_TIMEOUT=15000
```

### 4. Connection Health Monitoring
```javascript
// Sprawdzanie zdrowia połączenia
const isHealthy = await checkDatabaseConnection();

// Metryki performance
const metrics = await getDatabaseMetrics();
```

### 5. Graceful Shutdown
- Proper connection cleanup podczas shutdown
- SIGTERM/SIGINT handlers
- Production-ready deployment

## 📊 Database Metrics

Dostępne metryki (jeśli obsługiwane przez Prisma):
- Query counters
- Connection pool gauges  
- Response time histograms
- Error tracking

## ⚙️ Environment Variables

```bash
# Główna konfiguracja
DATABASE_URL="postgresql://user:pass@localhost:5432/buildboss"

# Timeout dla queries (opcjonalne)
DB_QUERY_TIMEOUT=10000

# Environment dla connection pool optimization
NODE_ENV=production
```

## 🔍 Debugging & Monitoring

### Development Debugging
```bash
# Włącz query logging
NODE_ENV=development npm start

# Logi będą zawierać:
# - Query SQL
# - Parameters
# - Execution time
# - Target database
```

### Production Monitoring
```bash
# Structured logging dla production
NODE_ENV=production npm start

# Health check database
curl http://localhost:5000/api/health/database

# Database metrics w health check
curl http://localhost:5000/api/health/detailed
```

## 📈 Performance Optimization Tips

### 1. Connection Pool Sizing
```javascript
// Dostosuj dla swojej infrastruktury:
// - CPU cores * 2 (dla I/O intensive)
// - CPU cores + 1 (dla CPU intensive)
// - Monitoruj connection utilization

production: {
  connection_limit: 20, // Adjust based on your server specs
  pool_timeout: 30
}
```

### 2. Query Optimization
- Użyj indexes dla często używanych queries
- Ograniczaj SELECT tylko do potrzebnych pól
- Używaj pagination dla dużych datasets

### 3. Connection Monitoring
```javascript
// Sprawdzaj metryki regularnie
const metrics = await getDatabaseMetrics();
logger.info('DB Performance', {
  activeConnections: metrics.gauges.active_connections,
  waitingQueries: metrics.gauges.waiting_queries
});
```

## 🚨 Common Issues & Solutions

### Problem: Connection Pool Exhausted
```bash
Error: "Too many clients already"
```
**Rozwiązanie**: Zwiększ `connection_limit` lub zoptymalizuj query patterns

### Problem: Slow Queries
```bash
Warning: Query timeout after 10000ms
```
**Rozwiązanie**: 
- Zwiększ `DB_QUERY_TIMEOUT`
- Dodaj database indexes
- Optymalizuj query complexity

### Problem: Memory Leaks
```bash
Error: "Memory usage increasing"
```
**Rozwiązanie**:
- Sprawdź graceful shutdown
- Verify connection cleanup
- Monitor with `getDatabaseMetrics()`

## 🏗️ Architecture Benefits

1. **Scalability**: Optimized connection pooling
2. **Reliability**: Timeout protection & error handling
3. **Observability**: Comprehensive logging & metrics
4. **Maintainability**: Centralized configuration
5. **Performance**: Environment-specific optimization

---

## 📚 Dalsze zasoby

- [Prisma Connection Pool Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/connection-pool)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [BuildBoss Health Check Documentation](./HEALTH_CHECKS.md)

---

*Ostatnia aktualizacja: 2025-06-26* 