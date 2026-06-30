---
title: "JAVA音频研究7：读取MP3标签信息（ID3V1、ID3V2）"
date: 2024-10-26 01:46:05
category: "JAVA音频研究"
tags:
- "java"
---

**在编写播放器的时候，需要读取mp3里包含的信息，于是写了下面的代码以读取ID3V2及ID3V1的信息，最终是数据保存在了info中 ，并且图片保存在了mp3文件同目录下。** 
需要注意的是，读取MP3的ID3V1信息的时候不知道它是用的什么编码，可能会导致读取的信息成为乱码，但一般不会存在ID3V1标签。
如果有问题可以私聊我，若要使用直接复制粘贴源代码创建一个相对应的类再调用即可
调用示例：

```java
//定义mediaInfoHandler 
MediaInfoHandler mediaInfoHandler= new MediaInfoHandler();
//扫描mp3文件
MediaInfoHandler.handle(file);
//得到mp3的标题
MediaInfoHandler.getMediaInfo().get("TIT2");
```

有伙伴反应只有安卓编译软件才能编译 ，电脑编译软件无法编译，已经修改。
编写不易，请多多点赞收藏 、打赏，后续会编写读取falc格式的信息。

```java
/**
 * mp3中
 * TAG_V1（ID3V1）包含了作者 、作曲 专辑信息等，长度128 byte
 * 标签头 TAG  3字节
 * 标题        30字节
 * 作者        30字节
 * 专辑        30字节
 * 出品年份     4字节
 * 备注        28字节
 * 保留        1字节
 * 音轨        1字节
 * 类型        1字节
 * TAG_V2（ID3V2）包含了作者、作曲专辑信息等，长度不固定，在 ID3V1主扩展的信息
 * Frame 一系列的媒体信息
 * 标题 TIT2
 * 作者 TPE1
 * 图片 APIC
 * 等等
 */

public class MediaInfoHandler {
    private HashMap info = null;
    private byte[] byteArray = null;
    byte[] imageByte = null;
    File file = null;

    public MediaInfoHandler(){
        //Log.e("MediaInfoHandler", "MediaInfoHandler: " );
    }

    public void handle(File file){
        this.info = new HashMap<String, String>();
        this.byteArray = null;
        this.imageByte = null;
        this.file = file;
        this.info.put("PATH", file.getAbsolutePath());
        getID3V2(this.file);
    }

    public HashMap getMediaInfo(){
        return this.info;
    }

    public byte[] saveImageByte(byte[] byteArray, int offset, int length){
        byte[]  imageByte = new byte[length];
        for(int i = 0; i < length; i++){
            imageByte[i] = byteArray[offset +  i];
        }
        return imageByte;
    }

    public int scanID3V2(int fileFramSize, String target) {
        int framsize = 0;
        String charset = Charset.defaultCharset().name();
        fileFramSize += 4;
            framsize = (byteArray[fileFramSize] & 0xff)  * 0x1000000
                    + (byteArray[fileFramSize + 1] & 0xff)  * 0x10000
                    + (byteArray[fileFramSize + 2] & 0xff)  * 0x100
                    + (byteArray[fileFramSize + 3] & 0xff) ;
        fileFramSize += 6;

        //Log.e(target, "编码: " + Byte.toString(byteArray[fileFramSize]));
        try {
            if (byteArray[fileFramSize] == 0) {
                charset = "ISO-8859-1";
                if(byteArray[fileFramSize + 1] == 0){
                    charset = null;
                    return -1;
                }
            } else if (byteArray[fileFramSize] == 1) {
                charset = "UTF-16";
            } else if (byteArray[fileFramSize] == 2) {
                charset = "UTF-16BE";
            } else if (byteArray[fileFramSize] == 3) {
                charset = "UTF-8";
            }

            //Log.e(target, ""+info.get(target)+"\n");
            if(target.equals("APIC")){
                getImageByte_ID3V2(new String(byteArray, fileFramSize  + 1, 25, charset), fileFramSize, framsize);
            }else if(target.equals("COMM")){
                info.put(target, new String(byteArray, fileFramSize  + 5, framsize - 5, charset));;
            }else {
                info.put(target, new String(byteArray, fileFramSize  + 1, framsize - 1, charset));;
            }
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        fileFramSize += framsize;
        charset = null;
        //Log.e(target, ""+info.get(target)+"\n");
        //Log.e("fileFramSize", ""+fileFramSize+"\n");
        //Log.e("byteArray.length", ""+byteArray.length+"\n");
        return fileFramSize;
    }

    public byte[] getTargetByte(byte[] imageByte, byte[] startByte, byte[] endByte){    //定义寻找目标字节开始的下标方法（索引）
        int startIndex = -1, endIndex = -1;
        byte[] targetByte = null;

        for(int i = 0; i < imageByte.length - startByte.length ; i++) {

            for(int k = 0; k < startByte.length; k++){
                if(imageByte[i + k] != startByte[k]){
                    break;
                }
                if (k == startByte.length - 1){startIndex = i;}
            }

            if(startIndex  != -1){
                break;
            }
        }

        if(startIndex != -1){
            for(int i = imageByte.length - 1; i >= endByte.length - 1; i--) {

                for(int k = 0; k < endByte.length; k++){
                    if(imageByte[i - k] != endByte[endByte.length - 1 - k]){
                        break;
                    }
                    if (k == endByte.length - 1){endIndex = i;}
                }

                if(endIndex  != -1){
                    break;
                }
            }
        }else{ return null; }

        //Log.e("endIndex", endIndex + "");
        if(endIndex != -1 && endIndex > startIndex){
            targetByte = new byte[endIndex - startIndex + 1];
            for(int i = 0; i < targetByte.length; i++) {
                targetByte[i] = imageByte[startIndex + i];
            }
        }else{ return null;}

        return targetByte;
    }

    public void createImage(){
        if(this.info.get("APIC") == null){return;}
        File imageFile = new File(file.getParent() + "/musicImage");
        char[] temp =  String.valueOf(info.get("TPE1")).toCharArray();
        if(!imageFile.exists()){
            imageFile.mkdir();
        }
        for(int i = 0, count  = 0; i <  temp.length; i++){
            if(temp[i] == '/'){
                if(++count == 3){
                    this.info.put("TPE1", String.valueOf(temp,0, i) + "……");
                }
            }
        }
        temp = null;
        //Log.e("temp", String.valueOf(info.get("TPE1")));
        imageFile = new File(file.getParent() + "/musicImage/" + String.valueOf(info.get("TIT2")).replace("/","、")
                + "_" + String.valueOf(info.get("TPE1")).replace("/","、") + "." + this.info.get("APIC"));
        FileOutputStream fileOutputStream = null;
        //Log.e("图片路径", imageFile.getAbsolutePath());
        //Log.e("图片是否存在", imageFile.exists() + "");
        if(imageFile.exists() == false){
            try {
                imageFile.createNewFile();
                fileOutputStream = new FileOutputStream(imageFile);
                fileOutputStream.write(this.imageByte);
                fileOutputStream.close();
                fileOutputStream = null;
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        info.put("APIC",imageFile.getAbsolutePath());
        this.imageByte  = null;
        imageFile = null;
    }

    public void getImageByte_ID3V2(String imageInfo, int fileFramSize, int framsize){
        //Log.e("imageInfo", ""+ imageInfo+"\n");
        if(imageInfo.toLowerCase().indexOf("jfif", 11) != -1
                || imageInfo.toLowerCase().indexOf("jpg", 11) != -1
                || imageInfo.toLowerCase().indexOf("jpeg", 11) != -1){
            byte[] JPGStartByte = new byte[] {(byte) 0xFF,(byte) 0xD8,(byte) 0xFF};
            byte[] JPGEndByte = new byte[] {(byte) 0xFF,(byte) 0xD9};
            this.info.put("APIC", "jpg");
            //Log.e("图片类型", ""+ info.get("APIC")+"\n");
            this.imageByte = getTargetByte(saveImageByte(this.byteArray,fileFramSize, framsize), JPGStartByte,  JPGEndByte);

        }else if(imageInfo.toLowerCase().indexOf("png", 11) != -1){
            byte[] PNGStartByte = new byte[] {(byte) 0x89,(byte) 0x50,(byte) 0x4E,(byte) 0x47};
            byte[] PNGEndByte = new byte[] {(byte) 0xAE,(byte) 0x42,(byte) 0x60,(byte) 0x82};
            this.info.put("APIC", "png");
            //Log.e("图片类型", ""+ info.get("APIC")+"\n");
            this.imageByte = getTargetByte(saveImageByte(this.byteArray,fileFramSize, framsize), PNGStartByte,  PNGEndByte);

        }else if(imageInfo.toLowerCase().indexOf("gif", 11) != -1){
            byte[] GIFStartByte = new byte[] { (byte) 0x47,(byte) 0x49,(byte) 0x46,(byte) 0x38};
            byte[] GIFEndByte = new byte[] { (byte) 0x00,(byte) 0x3B};
            this.info.put("APIC", "gif");
            //Log.e("图片类型", ""+ info.get("APIC")+"\n");
            this.imageByte = getTargetByte(saveImageByte(this.byteArray,fileFramSize, framsize), GIFStartByte,  GIFEndByte);
        }

        //Log.e("图片类型", ""+ info.get("APIC")+"\n");
    }

    public void getID3V2(File file){
        this.byteArray = new byte[10];
        //fileFramSize保存标签内容大小，不包含标签头大小(10 byte)
        int fileFramSize = 0;
        //framSize保存标签帧内容大小，不包含帧头大小(10 byte)
        String framHead = null;
        try(RandomAccessFile accessFile = new RandomAccessFile(file,"r")) {
            accessFile.seek(0);
            accessFile.read(byteArray);
            //Log.e("getID3V2 ", new String(byteArray,0,3)+ "");
            if(new String(byteArray,0,3).equals("ID3") && Byte.toString(byteArray[3]).equals("3")){
                fileFramSize = (byteArray[6] & 0x7F) * 0x200000
                        + (byteArray[7] & 0x7F) * (0x4000)
                        + (byteArray[8] & 0x7F) * (0x80)
                        + (byteArray[9] & (0x7F));
                //Log.e("fileFramSize", "" + fileFramSize);
                byteArray = new byte[fileFramSize];
                accessFile.read(byteArray);
                //fileFramSize 重赋值为0记录当前读取位置
                fileFramSize = 0;
                while(fileFramSize < byteArray.length - 10){
                    framHead = new String(byteArray,fileFramSize,4);
                    fileFramSize = scanID3V2(fileFramSize, framHead);
                    if(fileFramSize == -1){break;}
                }
                createImage();
                //Log.e("info", "getID3V2: " + this.info);
            }else {
                //Log.e("getID3V2", "没有ID3V2标签");
                getID3V1(file);
            }
        } catch (IOException e) {
            e.printStackTrace();
            getID3V1(file);
        }
        framHead = null;
        this.file = null;
        this.byteArray  = null;
    }

    //使用流打开的时候要注意，我们需要的是 最后128字节的信息
    public void getID3V1(File file){
        byteArray = new byte[128];
        try(RandomAccessFile accessFile = new RandomAccessFile(file,"r")) {
            //移动到最后128字节的位置
            accessFile.seek(accessFile.length() - 128);
            //Log.e("TAG", "length: " + length);
            //Log.e("TAG", "tag: " + new String(byteArray, 0, 3));
            if("TAG".equals(new String(byteArray, 0, 3))){
                info.put("TIT2", new String(byteArray, 3, 30));
                info.put("TPE1", new String(byteArray, 33, 30));
                info.put("专辑", new String(byteArray, 63, 30));
                info.put("年份", new String(byteArray, 93, 4));
            }
            else{
                //Log.e("getID3V1", "没有ID3V1标签");
                info.put("TIT2", file.getName());
                info.put("TPE1", "未知");
                info.put("专辑", "未知");
                info.put("年份", "未知");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
```