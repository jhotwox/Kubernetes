1. Ejecutar minikube para correr kubernetes de manera local
```BASH
minikube start
```
---
2. Crear deployment con la imagen de docker creaada y al final agregar el nombre que obtendra el deployment
```BASH 
kubectl create deployment --image jhotwox/kubernetes-node-app node-app
```
---
3.  Exponer el deployment a un puerto de node
```BASH
kubectl expose deployment node-app --type NodePort --port 3000
```
---
4. Obtener URL

    4.1.1 Obtener IP
    
    `kubectl get node -o wide`

    4.1.2  Obtener puerto
    
    `kubectl get service`

    4.2 Obtener URL si estamos usando minikube
    
    `minikube service node-app --url`
---
5. Modificar el archivo de configuración desde nano o vim, vsc no lo permite. Cambiar el puerto a 80 y el tipo a LoadBalancer 
```BASH
KUBE_EDITOR="nano" kubectl edit service node-app
```