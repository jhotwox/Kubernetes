# Kubernetes
El uso de los kubernetes es llevar los contenedores a otro nivel, no son exactamente lo mismo que los contenedores pero son bastante similares

En este caso crearemos una aplicación albergada en un cluster de tipo load balancer con 3 pods replica.
Esta aplicación nos servira de ejemplo para comprender las ventajas de los contenedores en kuberentes sobre los contenedores en docker.

Esta aplicación realizara una petición HTTP de tipo GET a una API que retorna un archivo JSON con un dato curioso al azar sobre los gatos. A la vez implementaremos un circuit breaker el cual nos ayuda a romper el ciclo de funcionamiento de nuestra app cuando no se recibe una respuesta por un tiempo o las petición HTTP no entrega una respuesta porque el servicio no esta funcionando.

# Herramientas utilizadas
- ### Docker
    > Herramienta que nos permite desplegar aplicaciones vituales dentro de contenedores lo cual nos permite aislar nuestras aplicaciones y volverlas mas automatizadas

- ### Kubernetes
    > Nos permite automatizar el despliegue, ajuste de escala y manejar nuestras aplicaciones en contenedores

- ### Minikube
    > Nos permite ejecutar kubernetes de manera local

- ### Opossum
    > Se trata de una herramienta que nos permite implementar cortadores de circuitos (circuit breakers) en nuestras aplicaciones en node.js

---
# Proceso
## SERVIDOR EXPRESS
```JS
const express = require("express")
const app = express()
const PORT = 3000

app.listen(PORT, () => {
  console.log(`"app listening on port ${PORT}"`)
})
```

### Fetch
```JS
const fetchCatFact = async () => {
    const result = await axios.get("https://catfact.ninja/fact")
  console.log("Cat response-> " + result.data.fact)
  return result.data.fact
}
```

### `unreliableService`
>Creamos una función que simule un servicio inestable el cual falla el 50% de la veces
```JS
const unreliableService = async () => {
    const random = Math.random()
  const shouldFail = random > 0.5
  console.log("Random number -> "+random)
  const result = await fetchCatFact()
  if (shouldFail) {
      throw new Error("Service failed")
  }

  return { message: result }
}
```

### Circuit Breaker
>Parametros de configuración del circuit breaker en un JSON
```JS
const options = {
    timeout: 2000, // Tiempo antes de fallar
  errorThresholdPercentage: 50, // Porcentaje de errores antes de abrir el circuito
  resetTimeout: 5000, // Tiempo antes de cerrar el circuito
}
```
> Crear una instancia de un circuit breaker, en el primer parametro colocar la función que realizara y en el segundo parametro la configuración
```JS
const CircuitBreaker = require("opossum")
const breaker = new CircuitBreaker(unreliableService, options)
```

>Proporcionar una respuesta alternativa en caso de que el circuit breaker esté abierto o falle el servicio.
```JS
breaker.fallback(() => ({ message: "Fallback response, service unavailable" }))
```

### Ruta HTTP GET
> Definir ruta HTTP GET en el endpoint "/data"
```JS
app.get("/data", async (req, res) => {
    try {
        const result = await breaker.fire()
    res.status(200).send(result.message)
  } catch (error) {
      res.status(503).json({ message: error.message })
  }
})
```

## DOCKER
>Configuración del archivo docker 
```Dockerfile
FROM node:19-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD node index.js
```

## KUBERNETES

### replicas
> Establecer 3 replicas en el deployment para tener un total de 3 pods sin contar el maestro
```BASH
kubectl scale deployment node-app --replicas 3
```

### Load Balancer
>Eejcutar el siguiente comando para ir a la configuración del kubernete y configurar el tipo de cluster como se observa en la imagen
```BASH
KUBE_EDITOR="nano" kubectl edit service node-app
```
<img src="https://github.com/jhotwox/Kubernetes/blob/main/conf.png?raw=true">

---
# RESULTADOS
### Pods replica
> Podemos observar que actualmente hay 3 pods replica
<img src="https://github.com/jhotwox/Kubernetes/blob/main/replicas.png?raw=true">

> Si eliminanos un pod observamos que al instante uno nuevo se crea
><img src="https://github.com/jhotwox/Kubernetes/blob/main/creating_new_pod.png?raw=true">

><img src="https://github.com/jhotwox/Kubernetes/blob/main/new_pod_runing.png?raw=true">

### APP en ejecución
> El servicio sigue activo
><img src="https://github.com/jhotwox/Kubernetes/blob/main/200.png?raw=true">

> El servicio no esta en linea por lo que pasamos al fallback
><img src="https://github.com/jhotwox/Kubernetes/blob/main/error.png?raw=true">
