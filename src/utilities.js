export const drawRect = (data, ctx) =>{
    //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    var imgheight = data.image.height, imgwidth = data.image.width;
    var predlength = data.predictions.length;
    
    for(let i = 0; i < predlength; i++){
        const x = data.predictions[i].bbox[0] * imgwidth; 
        const y = data.predictions[i].bbox[1] * imgheight; 
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
    /*ctx.beginPath();   
    ctx.fillStyle = '#84c8fb';
    ctx.rect(0, 0, 400, 50); 
    ctx.rect(0, 250, 400, 50);
    ctx.rect(0, 0, 50, 250);
    ctx.rect(350, 0, 50, 430)
    ctx.stroke();  */
}

export const drawRect2 = (detections, ctx) => {
    detections.forEach(prediction => {
        // Extract boxes and classes
        const [x, y, width, height] = prediction['bbox']; 
        const text = prediction['class']; 
    
        // Set styling
        const color = Math.floor(Math.random()*16777215).toString(16);
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