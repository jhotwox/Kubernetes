const express = require("express")
const CircuitBreaker = require("opossum")
const axios = require("axios")

const app = express()
const PORT = 3000

const fetchCatFact = async () => {
  const result = await axios.get("https://catfact.ninja/fact")
  console.log("Cat response-> " + result.data.fact)
  return result.data.fact
}

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

const options = {
  timeout: 2000, // Tiempo antes de fallar
  errorThresholdPercentage: 50, // Porcentaje de errores antes de abrir el circuito
  resetTimeout: 5000, // Tiempo antes de cerrar el circuito
}

const breaker = new CircuitBreaker(unreliableService, options)

breaker.fallback(() => ({ message: "Fallback response, service unavailable" }))

app.get("/data", async (req, res) => {
  try {
    const result = await breaker.fire()
    res.status(200).send(result.message)
  } catch (error) {
    res.status(503).json({ message: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`"app listening on port ${PORT}"`)
})

// http://192.168.49.2:30751/data
