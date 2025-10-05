const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("baileys")
const qrcode = require('qrcode-terminal')

const userContext = {}

//Funcion permite conectar a whatsapp
async function conectarWhatsapp(){
    console.log('Conectando ....')

    const {state, saveCreds} = await useMultiFileAuthState('nombre_usuario')
    // Autenticaion del usuario
    const sock = makeWASocket({
        "auth": state,
    })

    //Realiza la conexion
    sock.ev.on('connection.update', update => {
        const {qr, connection, lastDisconnect} = update

        if(qr){
            console.log('Escannee codigo QR')
            qrcode.generate(qr, {small:true});
        }

        if(connection === 'close'){
            const puedeContar = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.statusCode;
            if(puedeContar != DisconnectReason.loggedOut){
                console.log('Reconectando...')
                conectarWhatsapp()
            }else{
                console.log('Conexion cerrada!!')
            }
        }else if(connection === 'open'){
            console.log('Conexión Exitosa!')
        }
    })

    //guardar la autenticaion del usuario
    sock.ev.on('creds.update', saveCreds);

    //Recibir y enviar mensajes
    sock.ev.on('messages.upsert',async event => {

        const m = event.messages[0];
        const type = event.type;
        const id = m.key.remoteJid; //numero celular
        const nombre = m.pushName; //nombre uusario

        //mensaje del usuario
        const mensaje = m.message?.conversation || m.message?.extendedTextMessage?.text || 'Mensaje no deffinido';

        //para que no entre en bucle
        console.log(mensaje);
        if(type != 'notify' || m.key.fromMe || id.includes('@g.us') || id.includes('@broadcast')){
            return
        }

        if(!userContext[id]){
            userContext[id] = {menuActual: "main"};
            enviarMenu(sock, id, 'main');
            return;
        }

        const menuActual = userContext[id].menuActual;
        const menu =  menuData[menuActual];

        const opcionSeleccionada = menu.opciones[mensaje];

        if(opcionSeleccionada){
            if(opcionSeleccionada.respuesta){
                const tipo = opcionSeleccionada.respuesta.tipo;
                if(tipo == 'text'){
                    await sock.sendMessage(id, {text: opcionSeleccionada.respuesta.msg})
                }
                if(tipo == 'imagen'){
                    await sock.sendMessage(id, {image: opcionSeleccionada.respuesta.msg})
                }
                if(tipo == 'location'){
                    await sock.sendMessage(id, {location: opcionSeleccionada.respuesta.msg})
                }
            }else if(opcionSeleccionada.submenu){
                userContext[id].menuActual = opcionSeleccionada.submenu;
                enviarMenu(sock, id, opcionSeleccionada.submenu);
            }
        }else{
            await sock.sendMessage(id, {text: "Opcion invalida"});
            
        }
    });

}

conectarWhatsapp()

function enviarMenu(sock, id, menukey){
    const menu = menuData[menukey];

    const menuOpciones = Object.entries(menu.opciones)
        .map(([key, opcion]) => `👉 *${key}* : ${opcion.text}`)
        .join('\n');
    
    const mensaje = `${menu.mensaje}\n\n${menuOpciones}\n\n> Indicanos tu opcion`

    sock.sendMessage(id, {text: mensaje});
}


// const menuData = {
//    main:{
//     mensaje: "*Bienvenido a nuestra comunidad*",
//     opciones: {
//         A:{
//             text: "Mas información",
//             respuesta: {
//                 tipo: "text",
//                 msg: "Nosotros somos uns comunidad virtual dedicada a la educación",
//             }
//         },
//         B:{
//             text: "Ver catalogo",
//             respuesta: {
//                 tipo: "imagen",
//                 msg: {
//                     url: "https://static.vecteezy.com/system/resources/previews/015/792/198/non_2x/catalog-or-catalogue-or-product-catalog-template-vector.jpg",
//                 }
//             }
//         },
//         C:{
//             text: "Nuestra Ubicación",
//             respuesta: {
//                 tipo: "location",
//                 msg: {
//                     degreesLatitude: 24.121231,
//                     degreesLongitude: 55.1121221,
//                     address: "Av 123, calle ABC",
//                 }
//             }
//         },
//         D:{
//             text: "Hablar con un asesor",
//             respuesta: {
//                 tipo: "text",
//                 msg: "Este es el número de nuestros asesor +59168166901",
//             }
//         },
//         E:{
//             text: "Nuestros servicios",
//             submenu: "service"
//         }
//     }
//    },
//    service:{
//     mensaje: "*Observe nuestros servicios*",
//     opciones:{
//         1:{
//             text: "Desarrollo de software",
//             respuesta: {
//                 tipo: "text",
//                 msg: "Desarrollamos software a la medida",
//             }
//         },
//         2:{
//             text: "Nuestros clientes",
//             respuesta: {
//                 tipo: "imagen",
//                 msg: {
//                     url: "https://www.santanderopenacademy.com/content/dam/becasmicrosites/01-soa-blog/tipos-de-clientes-1.jpg"
//                 }
//             }
//         },
//         3:{
//             text: "Volver al menu principal",
//             submenu: "main",
//         }
//     }
//    }
// }
const menuData = {
   main: {
      mensaje: "👋 *¡Bienvenido a nuestra Tienda Electrónica!* 🛍️\n\nExplora nuestros productos, descubre ofertas y encuentra justo lo que necesitas 😍",
      opciones: {
         A: {
            text: "🧾 Más información",
            respuesta: {
               tipo: "text",
               msg: "Somos una tienda online dedicada a ofrecerte productos de calidad al mejor precio 💸. ¡Compra fácil, rápido y seguro desde tu casa! 🏠✨",
            }
         },
         B: {
            text: "📦 Ver catálogo",
            respuesta: {
               tipo: "imagen",
               msg: {
                  url: "https://static.vecteezy.com/system/resources/previews/015/792/198/non_2x/catalog-or-catalogue-or-product-catalog-template-vector.jpg",
               }
            }
         },
         C: {
            text: "📍 Nuestra ubicación",
            respuesta: {
               tipo: "location",
               msg: {
                  degreesLatitude: -16.5000,
                  degreesLongitude: -68.1193,
                  address: "Av. Comercio 456, Zona Centro",
               }
            }
         },
         D: {
            text: "💬 Hablar con un asesor",
            respuesta: {
               tipo: "text",
               msg: "📱 Contáctanos directamente con un asesor por WhatsApp: *+59168166901* — ¡te ayudaremos a encontrar el producto perfecto para ti! 😄",
            }
         },
         E: {
            text: "⚙️ Nuestros servicios",
            submenu: "service"
         }
      }
   },

   service: {
      mensaje: "✨ *Nuestros Servicios Premium* ✨",
      opciones: {
         1: {
            text: "🚚 Envíos a todo el país",
            respuesta: {
               tipo: "text",
               msg: "Hacemos envíos rápidos y seguros 📦 a cualquier parte del país. ¡Recibe tus compras sin moverte de casa! 🏡",
            }
         },
         2: {
            text: "💳 Métodos de pago",
            respuesta: {
               tipo: "imagen",
               msg: {
                  url: "https://cdn-icons-png.flaticon.com/512/2331/2331948.png"
               }
            }
         },
         3: {
            text: "⭐ Opiniones de clientes",
            respuesta: {
               tipo: "imagen",
               msg: {
                  url: "https://www.santanderopenacademy.com/content/dam/becasmicrosites/01-soa-blog/tipos-de-clientes-1.jpg"
               }
            }
         },
         4: {
            text: "↩️ Volver al menú principal",
            submenu: "main"
         }
      }
   }
}

// console.log(menuData['service']);
