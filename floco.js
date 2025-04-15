// 2) Considere a “regra” da figura abaixo que substitui um único segmento de linha por quatro
// segmentos mais curtos. Escreva um programa que comece com um triângulo e aplique
// iterativamente a regra de substituição a todos os segmentos de linha. O objeto que você gera é
// chamado de floco de neve de Koch. Faça com que o floco de neve fique rotacionando pela tela.
// Ideia: ficaria interessante colocar para mudar o ângulo de rotação a cada certo intervalo de tempo.
 
// Grupo:
// GEOVANNA DUARTE NASCIMENTO DA SILVA
// KATHERINE MARIA CARVALHO DA SILVA
// PEDRO HENRIQUE DE SOUSA JATOBA
// LETÍCIA RODRIGUES DE SOUSA

"use strict";

var gl;
var positions = [];

var nivel = 0;
var angulo = 0;
var velocidadeRotacao = 0.8;
var tempo = 0;

var locTransform;
var buffer;

// Usamos pontos iniciais ja fixos 
var pontosIniciais = [
  [vec2(-0.6, 0.3464), vec2(0.6, 0.3464)],//base
  [vec2(0.6, 0.3464), vec2(0.0, -0.6928)],//lado direito
  [vec2(0.0, -0.6928), vec2(-0.6, 0.3464)]//lado esquerdo
];

window.onload = init;

function init() {
  const canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext('webgl2');
  if (!gl){
    alert("WebGL não está disponível");
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0); //cor branca, que ira ser de fundo e limpar a tela

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  locTransform = gl.getUniformLocation(program, "uTransform");

  //Botão que irá aumentar o nivel de recursão quando clicado
  document.getElementById("aumentarNivel").onclick = () => {
    if (nivel < 5) nivel++;
    atualizar();
  };

  //Botão que irá aumentar o nivel de recursão
  document.getElementById("diminuirNivel").onclick = () => {
    if (nivel > 0) nivel--;
    atualizar();
  };

  //Muda a direção da rotação a cada 5 segundos
  setInterval(() => {
    velocidadeRotacao *= -1;
  }, 5000);

  atualizar();
  render();
}

//Atualiza os pontos com base no nível atual
function atualizar() {
  positions = [];
  for (var i = 0; i < pontosIniciais.length; i++) {
    var a = pontosIniciais[i][0];
    var b = pontosIniciais[i][1];
    gerarFloco(a, b, nivel); //Gerando os novos pontos, com base no triângulo inicial
  }

  //Envia os dados atualizados para o buffer na GPU
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
}

// Função recursiva para gerar os segmentos do floco
function gerarFloco(a, b, nivelAtual) {
  if (nivelAtual === 0) {
    positions.push(a, b);
  } else {
    
    var v = subtract(b, a);//Para obter o vetor entre a e b
    //Divide em 3 partes
    var umTerco = scale(1 / 3, v);
    var doisTercos = scale(2 / 3, v);

    //Pontos que divide o segmento em três partes
    var p1 = add(a, umTerco);
    var p2 = add(a, doisTercos);

    // Calcula o ponto topoo do triângulo equilátero, o topo é o bico do meio de cada segmento, a parte que aponta para fora
    var anguloTriangulo = radians(60);
    var topo = add(p1, vec2(
      umTerco[0] * Math.cos(anguloTriangulo) - umTerco[1] * Math.sin(anguloTriangulo),
      umTerco[0] * Math.sin(anguloTriangulo) + umTerco[1] * Math.cos(anguloTriangulo)
    ));

   
    nivelAtual--; //Diminiuindo o nivel da recursão

    //Chama recursivamente novos 4 segmentos
    gerarFloco(a, p1, nivelAtual);
    gerarFloco(p1, topo, nivelAtual);
    gerarFloco(topo, p2, nivelAtual);
    gerarFloco(p2, b, nivelAtual);
  }
}

// Renderiza a cena continuamente com rotação e movimento
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  angulo += velocidadeRotacao;//Atualiza toda vez o ângulo, fanzendo o floco girar sempre
  tempo += 0.02;

  var deslocX = 0.3 * Math.sin(tempo);//Movimento na horizontal
  var deslocY = 0.2 * Math.cos(tempo);//na vertical, os dois vao fazer ir de um lado pra o outro

  var rotacao = rotate(angulo, [0, 0, 1]);//girar o floco
  var translacao = translate(deslocX, deslocY, 0);//mover o floco
  var transform = mult(translacao, rotacao);//Com isso, floco gira enquanto se move

  gl.uniformMatrix4fv(locTransform, false, flatten(transform));//envia tudo isso para o shader
  
  gl.drawArrays(gl.LINES, 0, positions.length);

  requestAnimationFrame(render);
}
