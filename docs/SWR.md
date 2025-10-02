# Stale‑While‑Revalidate (SWR) в проекте

Цели:
- Мгновенно отдавать кэшированные данные в UI
- Обновлять данные в фоне без мерцаний
- Исключить дублирующиеся параллельные запросы
- Единый подход во всех сторах

## Как это работает

В `src/lib/swrCache.ts`:
- `shouldRevalidate(fetchedAt, ttlMs)` — решает, пора ли фонового обновления
- `dedupe(key, fetcher)` — дедупликация параллельных запросов по ключу

В сторах (пример — `useUserStore`):
- Держим `data`, `fetchedAt` (и, при необходимости, `isRefreshing`)
- `getX({ force, ttlMs })` делает:
  1. Если есть `data` — сразу возвращаем её (без спиннера)
  2. Если `force===true` или `shouldRevalidate(...)` — запускаем фоновый `fetch` через `dedupe`
  3. Если данных нет — обычный `fetch` с индикацией загрузки

Переменная окружения:
- `VITE_DISABLE_CACHE=true` — отключает использование кэша и заставляет всегда ходить в API

## Примеры

### Профиль пользователя
```ts
const { fetchUserProfile } = useUserStore.getState();
// мгновенно отдаст кеш, обновит в фоне (ttl по умолчанию 0 — всегда revalidate)
await fetchUserProfile();
```

### Навыки пользователя
```ts
const { fetchAvailableSkills } = useUserStore.getState();
await fetchAvailableSkills();
```

### Детали ардавта
```ts
const { fetchAravtDetails } = useAravtsStore.getState();
await fetchAravtDetails(aravtId); // вернет из кэша или обновит в фоне
```

## Рекомендации по интеграции
- Не храните SWR-логику в компонентах; используйте методы стора
- Для принудительного обновления используйте `force: true`
- Для избирательного кеша применяйте `ttlMs` (по умолчанию 0 — всегда фоновой рефреш)

```ts
await fetchUserProfile({ force: true });
await fetchAvailableSkills({ ttlMs: 60_000 });
```
