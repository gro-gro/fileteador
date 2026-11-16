# Fileteador

Taller vectorial web para dibujar fileteado porteño con curvas editables, tratamientos multicapa, espejos y ornamentos. Funciona íntegramente en el navegador y exporta SVG o PNG sin backend.

## Qué incluye

- Lápiz libre y pluma de curvas con previsualización.
- Edición directa de los puntos de cada trazado.
- Tratamiento de filete en cuatro capas: sombra, borde, cuerpo y luz.
- Cinco estilos iniciales y colores completamente editables.
- Simetría libre, vertical, horizontal, cuádruple y radial de 6 ejes.
- Flores, hojas de acanto y bolitas, sueltas o distribuidas sobre una curva.
- Historial de deshacer/rehacer, visibilidad por elemento y persistencia local.
- Exportación SVG limpia y PNG al doble de resolución.
- Interfaz adaptable a escritorio, tablet y móvil.

## Uso rápido

1. Elegí **Lápiz** (`N`) o **Pluma** (`P`).
2. Dibujá la curva base. En Pluma, usá `Enter` para terminar.
3. Elegí un estilo y ajustá cuerpo, contraste, sombra y curvatura.
4. Activá un espejo y, si querés, distribuí flores, acantos o bolitas.
5. Arrastrá los puntos azules para corregir la curva.
6. Exportá en SVG o PNG.

Atajos: `V` selección, `N` lápiz, `P` pluma, `F` flor, `H` acanto, `Esc` cancelar, `Delete` borrar, `Ctrl/Cmd + Z` deshacer.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

Stack: React, TypeScript, Vite, SVG nativo y Lucide. No usa base de datos ni servicios externos para guardar obras; el documento se persiste en `localStorage`.

## Referencias de diseño y oficio

La herramienta toma patrones de editores vectoriales y de dibujo, pero los reorganiza alrededor del flujo propio del fileteado.

### Fileteado porteño

- [Historia y repertorio del fileteado — Buenos Aires Ciudad](https://buenosaires.gob.ar/gcaba_historico/laciudad/fileteado-porteno): líneas de distintos grosores, volutas, flores, hojas de acanto, cintas y bolitas.
- [Formas de diseño — Buenos Aires Ciudad](https://buenosaires.gob.ar/gcaba_historico/laciudad/fileteado-porte%C3%83%C2%B1o/formas-de-diseno): familias de flores, composición orgánica y tradición ornamental.
- [Partes de un fileteado — Buenos Aires Ciudad](https://buenosaires.gob.ar/gcaba_historico/laciudad/fileteado-porte%C3%83%C2%B1o/partes-de-un-fileteado): vocabulario visual y estructura de una pieza.
- [Filete porteño — Patrimonio de la Ciudad](https://buenosaires.gob.ar/gcaba_historico/cultura/patrimonio-de-la-ciudad/acciones/filete-porteno): simetría, espirales, contraste y volumen mediante luces y sombras.
- [Expediente de patrimonio inmaterial — UNESCO](https://ich.unesco.org/es/RL/el-filete-porteno-de-buenos-aires-una-tecnica-pictorica-tradicional-01069): colores vivos, tipografía específica y memoria colectiva.
- [Reseña de Alfredo Genovese](https://buenosaires.gob.ar/areas/cultura/cpphc/archivos/libros/filete_porteno.pdf): historia, técnicas y genealogía del oficio.

### Herramientas digitales

- [Pen Tool — Adobe Illustrator](https://helpx.adobe.com/illustrator/using/tool-techniques/pen-tool.html): creación por anclas, curvas y finalización de trazados abiertos.
- [Curvature Tool — Adobe Illustrator](https://helpx.adobe.com/uk/illustrator/desktop/draw-shapes-and-paths/draw-shapes/draw-shapes-with-the-curvature-tool.html): previsualización de curva y edición directa de puntos.
- [Drawing Tools — Adobe Illustrator](https://helpx.adobe.com/in/illustrator/using/draw-tools.html): separación entre lápiz libre, pluma y herramientas de suavizado.
- [Drawing Guides — Procreate](https://help.procreate.com/procreate/handbook/guides): simetría por planos y asistencia al dibujo.
- [Multibrush — Krita](https://docs.krita.org/en/reference_manual/tools/multibrush.html): espejos X/Y, simetría radial y modo copo de nieve.
- [Mirror Tools — Krita](https://docs.krita.org/en/user_manual/mirror_tools.html): ejes visibles, móviles y compatibles con trazados Bézier.
- [Shapes y ayudas de dibujo — Adobe Fresco](https://helpx.adobe.com/uk/fresco/using/shapes.html): guías que acompañan el trazo sin sustituir el gesto.

## Criterio visual

La interfaz mezcla la densidad de una aplicación de escritorio con materiales de taller: fondo carbón, papel marfil, metal dorado y acentos esmalte. La pieza inicial no es decorativa: funciona como ejemplo editable de voluta, guarda, flor, acanto, bolita, luz, sombra y espejo.

