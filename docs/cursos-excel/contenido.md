# Cursos virtuales de Excel

| Curso | Precio propuesto | Duración estimada | Requisito |
|---|---:|---:|---|
| Excel Básico | S/ 49 | 4 horas | Manejo básico de archivos |
| Excel Intermedio | S/ 79 | 6 horas | Fórmulas, referencias y tablas básicas |
| Excel Avanzado con Macros | S/ 119 | 8 horas | Excel de escritorio con VBA y dominio de tablas |

## Excel Básico

Organiza datos en hojas de cálculo, realiza cálculos cotidianos y presenta resultados con tablas y gráficos. Proyecto final: presupuesto mensual.

1. **Libros, hojas y celdas.** Crea un libro, cambia el nombre de una hoja y escribe fechas, texto y números. Carga las filas del ejercicio en una hoja llamada Gastos. Aplica formato de fecha a la primera columna y de moneda a la última.
2. **Fórmulas y referencias.** Usa SUMA, PROMEDIO y MAX sobre la columna Importe. Coloca 200 en H1 como presupuesto y calcula la proporción de cada gasto con la fórmula =D2/$H$1. Copia hacia abajo y verifica que la referencia al presupuesto se mantenga fija.
3. **Tablas, orden y filtros.** Convierte el rango en tabla con encabezados. Ordena los importes de mayor a menor y filtra Alimentación. Quita el filtro antes de preparar el resumen.
4. **Gráficos y presupuesto.** Resume cada categoría con SUMAR.SI y grafica los totales en columnas. Calcula el saldo con =H1-SUMA(D2:D6). Entrega el libro con la tabla, el resumen y el gráfico.

~~~csv
Fecha,Categoría,Concepto,Importe
2026-11-01,Alimentación,Mercado,45
2026-11-02,Transporte,Pasajes,12
2026-11-03,Servicios,Internet,80
2026-11-04,Alimentación,Almuerzo,18
2026-11-05,Transporte,Taxi,15
~~~

**Autocorrección.** Total S/ 170. Promedio S/ 34. Gasto máximo S/ 80. Alimentación S/ 63, Transporte S/ 27 y Servicios S/ 80. Saldo S/ 30.

## Excel Intermedio

Cruza registros con un catálogo, controla la captura de datos y analiza ventas con tablas dinámicas. Proyecto final: reporte de ventas por región y producto.

1. **Calidad de datos.** Convierte el catálogo y las ventas en tablas. Aplica validación de número entero mayor que cero a Unidades y valida la región con una lista. Comprueba el comportamiento al escribir 0 y una región inexistente.
2. **Búsqueda y manejo de errores.** Nombra la tabla del catálogo Catálogo. Agrega Precio a la tabla de ventas con =BUSCARX([@SKU];Catálogo[SKU];Catálogo[Precio];"SKU desconocido"). Prueba un SKU inválido y corrígelo antes de calcular Importe como Unidades por Precio. Si tu versión carece de BUSCARX, usa BUSCARV con coincidencia exacta.
3. **Indicadores con criterios.** Usa SUMAR.SI.CONJUNTO para obtener el importe vendido por región y CONTAR.SI.CONJUNTO para contar operaciones de cada combinación de región y SKU. Aplica formato condicional a ventas individuales superiores a S/ 100.
4. **Tabla dinámica y reporte.** Pon Región en filas, SKU en columnas e Importe como suma. Crea un gráfico y añade una segmentación por región. Agrega una operación a la tabla y actualiza la tabla dinámica para verificar que recoge la nueva fila.

Catálogo

~~~csv
SKU,Producto,Precio
A01,Cuaderno,20
B02,Mochila,90
~~~

Ventas

~~~csv
Región,SKU,Unidades
Lima,A01,3
Cusco,B02,2
Lima,B02,1
Cusco,A01,4
~~~

**Autocorrección.** Con las cuatro filas iniciales, Lima suma S/ 150 y Cusco S/ 260. El total es S/ 410. Solo la venta de dos mochilas en Cusco supera S/ 100.

## Excel Avanzado con Macros

Graba y edita macros en VBA para automatizar el formato y la actualización de un reporte. Proyecto final: generar un resumen repetible desde una tabla de ventas.

1. **Grabadora y libros habilitados para macros.** Guarda una copia del ejercicio en formato .xlsm. Graba el formato del encabezado y revisa el código generado en el editor de VBA. Ejecuta la macro en la copia de práctica.
2. **Objetos y referencias explícitas.** Crea una hoja Ventas con los datos del curso intermedio, agrega Importe y nombra la tabla tblVentas. Crea una hoja Resumen. Usa ThisWorkbook para identificar el libro y ListObjects para localizar la tabla sin depender de la hoja seleccionada.
3. **Validación y control de errores.** Crea un módulo estándar y pega la macro siguiente. Ejecuta con una tabla vacía y luego renombra temporalmente la hoja Ventas para comprobar los mensajes.
4. **Automatización y verificación.** Asigna la macro a un botón de formulario en Resumen. Ejecútala dos veces y comprueba que el resultado ocupa las mismas celdas. Agrega una fila de S/ 40 y confirma que el resumen cambia a S/ 450 y cinco operaciones.

~~~vb
Option Explicit

Public Sub ActualizarResumen()
    On Error GoTo MostrarError

    Dim ventas As ListObject
    Dim importes As Range
    Dim resumen As Worksheet

    Set ventas = ThisWorkbook.Worksheets("Ventas").ListObjects("tblVentas")
    Set resumen = ThisWorkbook.Worksheets("Resumen")
    Set importes = ventas.ListColumns("Importe").DataBodyRange

    If importes Is Nothing Then
        MsgBox "Agrega ventas antes de actualizar el resumen.", vbInformation
        Exit Sub
    End If

    If Application.Count(importes) <> ventas.ListRows.Count Then
        MsgBox "Revisa que todos los importes sean numéricos.", vbExclamation
        Exit Sub
    End If

    With resumen
        .Range("A1").Value = "Total de ventas"
        .Range("B1").Value = Application.WorksheetFunction.Sum(importes)
        .Range("B1").NumberFormat = """S/ ""#,##0.00"
        .Range("A2").Value = "Operaciones"
        .Range("B2").Value = ventas.ListRows.Count
    End With
    Exit Sub

MostrarError:
    MsgBox "No se pudo actualizar el resumen. " & Err.Description, vbExclamation
End Sub
~~~

**Autocorrección.** Con las cuatro filas iniciales, el resultado es S/ 410 y cuatro operaciones. Si falta la hoja o la tabla, la macro muestra un mensaje.

## Carga en el catálogo

En Administración → Cursos, crea una ficha por nivel. Usa el párrafo de introducción como descripción y los cuatro módulos numerados como temario. Registra el precio en soles. Sube el material de cada nivel como PDF o archivo mediante el panel y conserva el curso como borrador hasta comprobar que los adjuntos están disponibles. Activa la publicación cuando la ficha y los materiales estén listos.
