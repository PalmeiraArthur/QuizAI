export function getBackgroundColor(seed) {
  const colors = [
    "#221A47", // roxo
    "#6CAA7F", // verde
    "#0984E3", // azul
    "#D63031", // vermelho
    "#E17055", // laranja
    "#29377E", // azul escuro
    "#F9B44D", // amarelo
    "#702945", // vinho
    "#DADBC7", //creme
  ];

  // cria um hash simples baseado na string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // pega sempre o mesmo índice
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
