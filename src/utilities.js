export const drawRect = (data, ctx, width, height) => {
    var imgwidth = width
    var imgheight = height
    var predlength = data.predictions.length;

    for (let i = 0; i < predlength; i++){
        var x = data.predictions[i].bbox[0] * imgwidth;
        var y = data.predictions[i].bbox[1] * imgheight;

        const width = (data.predictions[i].bbox[2] * imgwidth) - x;
        const height = (data.predictions[i].bbox[3] * imgheight) - y;
        const text = data.predictions[i].name + ": " + data.predictions[i].confidence.toFixed(3);

        ctx.strokeStyle = '#84c8fb';
        ctx.lineWidth = 3.0;
        ctx.font = '18px Arial';

        ctx.beginPath();
        ctx.fillStyle = '#84c8fb';
        ctx.fillRect(x - 2, y - 20, ctx.measureText(text).width + 8, 20);
        ctx.fillStyle = '#000000';
        ctx.fillText(text, x + 2, y - 3);
        ctx.rect(x, y, width, height);
        ctx.stroke();
    }
}

export const drawRect3 = (ctx) => {
    ctx.strokeStyle = '#84c8fb';
    ctx.lineWidth = 3.0;
    ctx.font = '18px Arial';

    // Draw rectangles and text
    ctx.beginPath();
    ctx.fillStyle = '#84c8fb';
    ctx.rect(0, 298, 1079, 1267);
    ctx.stroke();
    //190 for ipad, 460 for phon

    ctx.strokeStyle = '#5729c8';
    ctx.rect(440, 50, 50, 50);
    ctx.stroke();

    ctx.strokeStyle = '#f4c430';
    ctx.stroke();

    ctx.strokeStyle = "#49e675";
    ctx.rect(1010, 1645, 530, 200);

    /*
    ctx.rect(22, 2, 1875, 1005);
    ctx.moveTo(22, 2);
    ctx.lineTo(1920, 1020);
    */
    ctx.stroke();
}

export const drawRect2 = (detections, ctx) => {
    detections.forEach(prediction => {
        // Extract boxes and classes
        const [x, y, width, height] = prediction['bbox'];
        const text = prediction['class'];

        // Set styling
        const color = Math.floor(Math.random() * 16777215).toString(16);
        ctx.strokeStyle = '#84c8fb';
        ctx.lineWidth = 3.0;
        ctx.font = '18px Arial';

        // Draw rectangles and text
        ctx.beginPath();
        ctx.fillStyle = '#84c8fb';
        ctx.fillRect(x - 2, y - 20, ctx.measureText(text).width + 8, 20);

        //if(y < )
        ctx.fillStyle = '#000000';
        ctx.fillText(text, x + 2, y - 3);
        ctx.rect(x, y, width, height);
        ctx.stroke();
    });
}


export const drawText = (text, ctx) => {
    // Set styling
    const color = Math.floor(Math.random() * 16777215).toString(16);
    var x = 22,
        y = 42,
        width = ctx.width - x * 2,
        height = ctx.height - y * 2;
    ctx.strokeStyle = '#84c8fb';
    ctx.lineWidth = 3.0;
    ctx.font = '24px Source Sans Pro';

    // Draw rectangles and text
    ctx.beginPath();
    ctx.fillStyle = '#84c8fb';
    ctx.fillRect(x - 2, y - 20, ctx.measureText(text).width + 8, 20);

    //if(y < )
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x + 2, y - 3);
    ctx.rect(x, y, width, height);
    ctx.stroke();
}