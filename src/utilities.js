export const drawRect = (data, ctx) => {
    var imgwidth = data.image.width;
    var imgheight = data.image.height;
    var predlength = data.predictions.length;

    for (let i = 0; i < predlength; i++) {
        //just transform to make it fit on an android phone
        //460 offset on x to work, y seems to be just 0.
        var x = data.predictions[i].bbox[0] * 1540;
        var y = data.predictions[i].bbox[1] * 1845;

        const width = (data.predictions[i].bbox[2] * 1540) - x;
        const height = (data.predictions[i].bbox[3] * 1845) - y;

        x += 230;
        y += 60;

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
    ctx.rect(10, 10, 1900, 100);
    //190 for ipad, 460 for phone
    ctx.rect(460, 50, 50, 50);
    ctx.rect(1389, 781, 50, 50);
    ctx.rect(690, 385, 50, 50)
    ctx.rect(500, 500, 400, 400);
    ctx.rect(1010, 1645, 530, 200);
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