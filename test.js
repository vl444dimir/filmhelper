const key = 'PCMHSYQ-P7R4QEF-NAJ4TAB-X75ES89';
const url = 'https://api.kinopoisk.dev/v1/movie/possible-values-by-field?field=genres.name';
fetch(url, { headers: { 'X-API-KEY': key } })
  .then(res => res.json())
  .then(data => console.log(data.map(d => d.name)))
  .catch(console.error);
