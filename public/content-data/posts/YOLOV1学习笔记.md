---
title: "YOLOV1学习笔记"
date: 2024-10-27 18:19:31
category: "目标检测"
tags:
- "YOLO"
- "学习"
- "笔记"
---

### 1. 前置知识简介

#### 1.1 方向梯度直方图（HOG, Histogram of Oriented Gradient）

在计算机视觉以及数字图像处理中方向梯度直方图是一种能对物体进行检测的基于形状边缘特征的描述算子（用于量化图像局部特征的算法工具，它将图像中的关键点，例如角点、边缘点或尺度不变特征点，周围的像素信息转化为固定长度的数值向量，这些向量可以代表关键点的局部纹理、形状和光照不变性等特征。描述算子的主要目的是为了能够在不同的条件下，比如图像旋转、缩放、亮度变化等，仍然能够可靠地匹配同一物体或场景的不同视图中的相同或相似特征点。），它的基本思想是利用梯度信息能很好的反映图像目标的边缘信息并通过局部梯度的大小将图像局部的外观和形状特征化。

HOG特征提取的过程如下:

将一个image（你要检测的目标或者扫描窗口）：

1）灰度化（将图像看做一个x,y,z（灰度）的三维图像）；

2）采用Gamma校正法对输入图像进行颜色空间的标准化（归一化）；目的是调节图像的对比度，降低图像局部的阴影和光照变化所造成的影响，同时可以抑制噪音的干扰；

3）计算图像每个像素的梯度（包括大小和方向）；主要是为了捕获轮廓信息，同时进一步弱化光照的干扰。

4）将图像划分成小cells（8*8像素 / cell）；

5）统计每个cell的梯度直方图（不同梯度的个数），即可形成每个cell的descriptor；

6）将每几个cell组成一个block（2*2个cell / block），一个block内所有cell的特征descriptor串联起来便得到该block的HOG特征descriptor。

7）将图像image内的所有block的HOG特征descriptor串联起来就可以得到该image（你要检测的目标）的HOG特征descriptor了，即最终可供分类使用的特征向量。

 <img src="https://i-blog.csdnimg.cn/blog_migrate/743b55e323bea407127c4f00dc652b18.png" alt="" style="max-height:680px; box-sizing:content-box;" />






总结：Dalal提出的Hog特征提取的过程：把样本图像分割为若干个像素的单元（cell），把梯度方向平均划分为9个区间（bin），在每个单元里面对所有像素的梯度方向在各个方向区间进行直方图统计，得到一个9维的特征向量，每相邻的4个单元构成一个块（block），把一个块内的特征向量联起来得到36维的特征向量，用块对样本图像进行扫描，扫描步长为一个单元。最后将所有块的特征串联起来，就得到了人体的特征。

对于64*128的图像而言，每8*8的像素组成一个cell，每2*2个cell组成一个块，因为每个cell有9个特征，所以每个块内有4*9=36个特征，以8个像素为步长，那么，水平方向将有7个扫描窗口，垂直方向将有15个扫描窗口，则64*128的图片，总共有36*7*15=3780个特征。

本节主要摘自： [目标检测的图像特征提取之（一）HOG特征_图像特征提取hog-CSDN博客](https://blog.csdn.net/liulina603/article/details/8291093) 

#### 1.2. 可变组件模型（DPM, Deformable Parts Model）

DPM采用了传统的滑动窗口检测方式，通过构建尺度金字塔在各个 尺度搜索。下图为某一尺度下的行人检测流程，即行人模型的匹配过程。某一位置与根模型/部件模型的响应得分，为该模型与以该位置为锚点（即左上角坐标）的子窗口区域内的特征的内积。也可以将模型看作一个滤波算子，响应得分为特征与待匹配模型的相似程度，越相似则得分越高。

 <img src="https://i-blog.csdnimg.cn/blog_migrate/2150dad4df27064dfcd89e3259a6780d.png" alt="" style="max-height:851px; box-sizing:content-box;" />




左侧为根模型的检测流程，跟模型响应的图中，越亮的区域代表响应得分越高。右侧为各部件模型的检测过程。首先，将特征图像与模型进行匹配得到部件模型响应图。然后，进行响应变换：以锚点为参考位置，综合考虑部件模型与特征的匹配程度和部件模型相对理想位置的偏离损失，得到的最优的部件模型位置和响应得分。

如上图所示，对于任意一张输入图像，提取其DPM特征图，然后将原始图像进行高斯金字塔上采样放大原图像，然后提取其DPM特征图（2倍分辨率）。将原始图像的DPM特征图和训练好的Root filter做卷积操作，从而得到Root filter的响应图。对于2倍图像的DPM特征图，和训练好的Part filter做卷积操作，从而得到Part filter的响应图。然后对其精细高斯金字塔的下采样操作。这样Root filter的响应图和Part filter的响应图就具有相同的分辨率了。然后将其进行加权平均，得到最终的响应图，亮度越大表示响应值越大。

#### 1.3. 区域卷积神经网络（R-CNN）

R-CNN的核心思想是将目标检测问题转化为一系列的候选区域（region proposal）的分类问题。首先，它使用一个基于选择性搜索（Selective Search）的方法生成一组可能包含目标的候选区域。然后，对每个候选区域，RCNN通过在该区域上进行前向传播来提取固定长度的特征向量。这些特征向量随后被输入到一个独立的SVM分类器中，以判断该区域是否包含目标，同时还有一个边界框回归器用于精确定位目标的位置。

算法步骤如下：

1）获取候选区域：对于一张输入的图像，首先使用selective search算法获取2000个左右的候选区域，由于selective search生成的候选区域是大小不一致的区域，而后续的卷积神经网络中的全连接层需要保证固定大小的输入，因此在输入卷积网络之后将其缩放至固定大小的图像；

2）获取图像特征：将图像输入到卷积神经网络中获取图像特征，这一部分可以采用常用的图像卷积神经网络如VGGNet, AlexNet等。

3）获取区域类别：在初步获得目标的位置之后，需要获取目标的类别，这一步采用支持向量机（SVM, support vector machines）分类器来判断当前区域属于哪个类别。

4）微调区域位置：尽管候选区域已经初步目标的位置，但是这个区域比较粗糙，因此使用回归器对区域位置进行微调

<img src="https://i-blog.csdnimg.cn/blog_migrate/da4a7af22a51a0b357c125ae0dfeab1a.png#pic_center" alt="" style="max-height:401px; box-sizing:content-box;" />

本节主要摘自： [深度学习之目标检测R-CNN模型算法流程详解说明（超详细理论篇）_rcnn缺点-CSDN博客](https://blog.csdn.net/qq_55433305/article/details/131177839) 

### 2. YOLOV1

#### 2.1. 思想

YOLO将目标检测问题作为回归问题。将输入图像分成S×S的网格，如果一个物体的中心点落入到一个cell中，那么该cell就要负责预测该物体，一个格子只能预测一个物体，会生成两个预测框。

grid cell：

1）预测B个边界框，每个框都有一个置信度分数（confidence score）这些框大小尺寸等等都随便，只有一个要求，就是生成框的中心点必须在grid cell里。

2）不管框 B 的数量是多少，只负责预测一个目标。

3）预测 C 个条件概率类别（物体属于每一种类别的可能性）

4）每个边界框包含5个元素：(x, y, w, h, c)

<img src="https://i-blog.csdnimg.cn/blog_migrate/67b3476188a0cf220b800d4041e97733.png#pic_center" alt="" style="max-height:357px; box-sizing:content-box;" />

x，y： 指bounding box的预测框的中心坐标相较于该bounding box归属的grid cell左上角的偏移量，在0-1之间。

在下图中，绿色虚线框代表grid cell，绿点表示该grid cell的左上角坐标，为（0，0）；红色和蓝色框代表该grid cell包含的两个bounding box，红点和蓝点表示这两个bounding box的中心坐标。有一点很重要，bounding box的中心坐标一定在该grid cell内部，因此，红点和蓝点的坐标可以归一化在0-1之间。在上图中，红点的坐标为（0.5，0.5），即x=y=0.5，蓝点的坐标为（0.9，0.9），即x=y=0.9。

<img src="https://i-blog.csdnimg.cn/blog_migrate/197b1ebb3b8a5d55426eb34fc4bbbb84.png#pic_center" alt="" style="max-height:251px; box-sizing:content-box;" />

w，h： 指该bounding box的宽和高，但也归一化到了0-1之间，表示相较于原始图像的宽和高（即448个像素）。比如该bounding box预测的框宽是44.8个像素，高也是44.8个像素，则w=0.1, h=0.1    下图红框：x=0.8, y=0.5, w=0.1, h=0.2

<img src="https://i-blog.csdnimg.cn/blog_migrate/048ee3cc980984b8fbffba3a8d4c64f5.png#pic_center" alt="" style="max-height:199px; box-sizing:content-box;" />

综上，S×S 个网格，每个网格要预测 B个bounding box （下图的中间上图），还要预测 C 个类（下图的中间下图）。将两图合并，网络输出就是一个 S × S × (5×B+C)大小的张量。（S x S个网格，每个网格都有B个预测框，每个框又有5个参数，再加上每个网格都有C个预测类）

<img src="https://i-blog.csdnimg.cn/blog_migrate/bb6e19af9e50039827b06d3815cc17ed.png#pic_center" alt="" style="max-height:765px; box-sizing:content-box;" />

注：

1）一个cell预测的两个边界框共用一个类别预测， 在训练时会选取与标签IoU更大的一个边框负责回归该真实物体框，在测试时会选取置信度更高的一个边框，另一个会被舍弃，因此7×7=49个gird cell最多只能预测49个物体。
2）因为每一个 grid cell只能有一个分类，也就是他只能预测一个物体，这也是导致YOLO对小目标物体性能比较差的原因。如果所给图片极其密集，导致 grid cell里可能有多个物体，但是YOLO模型只能预测出来一个，那这样就会忽略在本grid cell内的其他物体。

#### 2.2. 结构

YOLO网络结构借鉴了 GoogLeNet，输入图像的尺寸为448×448，经过24个卷积层，2个全连接的层（FC），最后在reshape操作，输出的张量大小为7×7×30。

<img src="https://i-blog.csdnimg.cn/blog_migrate/a9941e8bac0484503db99a81b89aec88.png#pic_center" alt="" style="max-height:349px; box-sizing:content-box;" />

其中：

1）7×7： 一共划分成7×7的网格。
2）30： 每个网格包含了两个预测框的参数和Pascal VOC的类别参数：每个预测框有5个参数：x,y,w,h,c。另外，Pascal VOC里面还有20个类别；所以最后的30实际上是由5x2+20组成的，也就是说这一个30维的向量就是一个gird cell的信息。

 <img src="https://i-blog.csdnimg.cn/blog_migrate/7c0386a7addb4c0884286b77f5541427.png" alt="" style="max-height:359px; box-sizing:content-box;" />

 <img src="https://i-blog.csdnimg.cn/blog_migrate/41b01eaf4636bba1c02d4bca4fc79867.png" alt="" style="max-height:615px; box-sizing:content-box;" />

注：

1）YOLO主要是建立一个CNN网络生成预测7×7×1024 的张量 。

2）然后使用两个全连接层执行线性回归，以进行7×7×2 边界框预测。将具有高置信度得分的结果作为最终预测。

3）在3×3的卷积后通常会接一个通道数更低1×1的卷积，这种方式既降低了计算量，同时也提升了模型的非线性能力。

4）除了最后一层使用了线性激活函数外，其余层的激活函数为 Leaky ReLU ：

<img src="https://i-blog.csdnimg.cn/blog_migrate/2fc70d59e29720ab2bfad4799e49dbc0.png#pic_center" alt="" style="max-height:77px; box-sizing:content-box;" />

5）在训练中使用了 Dropout 与数据增强的方法来防止过拟合。

6）对于最后一个卷积层，它输出一个形状为 (7, 7, 1024) 的张量。 然后张量展开。使用2个全连接层作为一种线性回归的形式，它输出1470个参数，然后reshape为 (7, 7, 30)

#### 2.3. 训练、预测与验证

训练阶段:

首先在ImageNet上对网络中的前20层进行预训练，之后再在这20层后连上4层卷积和2层全连接层进行训练。所以，前20层是用预训练网络初始化，最后的这6层是随机初始化的并在训练过程中更新权重。此外，因为detection需要更多图片细节的信息，所以在训练时，统一将输入图片的size从224×244调整为448×448。对于loss函数，是通过ground truth和输出之间的sum-squared error进行计算的，所以相当于把分类问题也当成回归问题来计算loss。下面分析loss函数：

1）位置误差：主要是计算bbox的 (𝑥,𝑦,𝑤,ℎ) 和对应的ground truth box的 (𝑥,𝑦,𝑤,ℎ) 之间的sum-squared error，需要注意的是并不是所有的bbox都参与loss的计算，首先必须是第i个单元格中存在object，并且该单元格中的第j个bbox和ground truth box有最大的IoU值，那么这个bbox j才参与loss的计算，其他的不满足条件的bbox不参与。此外，因为误差在小的box上体现的更明显，就是一点点小的位置上的偏差可能对大的box影响不是很大，但是对小的box的影响就比较明显了，所以为了给不同size的box的位置loss赋予不同的‘权重’，需要对w和h开方后才进行计算。根据下面 $$
y = \sqrt{x}
$$的函数图像可知，当x较小时，x的一点小的变化都会导致y大的变化，而当x较大的时候，x的一点儿小的变化不会让y的变化太大。 但这个方法只能减弱这个问题，并不能彻底解决这个问题。

<img src="https://i-blog.csdnimg.cn/blog_migrate/51b3d89140f0009f0b9e2653fb9c41e4.png#pic_center" alt="" style="max-height:460px; box-sizing:content-box;" />

2）置信度误差：分两种情况，一是有object的单元格的置信度计算，另一种是没有object的单元格的置信度计算。两种情况都是单元格中所有的bbox都参与计算。对于有object的单元格中的bbox的置信度的ground truth就是 $$
1 * IOU_{Pred}^{Truth}
$$。需要注意的是这个IOU是在训练过程中不断计算出来的，因为网络在训练过程中每次预测的bbox是变化的，所以bbox和ground truth计算出来的IOU每次也会不一样。而对于没有object的单元格中的bbox的置信度的ground truth为 $$
0 * IOU_{Pred}^{Truth} = 0
$$，因为不包含物体。

3）分类误差：当作回归误差来计算，使用sum-squared error来计算分类误差，需要注意的是只有包含object的单元格才参与分类loss的计算，即有object中心点落入的单元格才进行分类loss的计算，而这个单元格的ground truth label就是该物体的label。

注：

1）更重视8维的坐标预测，给这些损失前面赋予更大的loss weight, 记为 𝜆𝑐𝑜𝑜𝑟𝑑 ,在pascal VOC训练中取5。（上图蓝色框）

2）对没有object的bbox的confidence loss，赋予小的loss weight，记为 𝜆𝑛𝑜𝑜𝑏𝑗 ，在pascal VOC训练中取0.5。（上图橙色框）

3）有object的bbox的confidence loss (图6红色框) 和类别的loss （上图紫色框）的loss weight正常取1。

预测与验证阶段：

将一张图输入到网络中，然后得到一个 7×7×30 的预测结果。然后将计算结果中的每个单元格预测的类别信息 $$
Pr(class_{i}|object)
$$和每个bbox的置信度信息 $$
Pr(object) * IOU_{Pred}^{Truth}
$$相乘即可得到每个bbox的class-specific confidence score：

<img src="https://i-blog.csdnimg.cn/blog_migrate/ba341157d23fed487564420b5b6d06e2.png#pic_center" alt="" style="max-height:43px; box-sizing:content-box;" />

<img src="https://i-blog.csdnimg.cn/blog_migrate/42d89464b0ae7041ba4b50e9cbabdc03.png#pic_center" alt="" style="max-height:775px; box-sizing:content-box;" />

根据同样的方法可以计算得到7 x 7 x 2 = 98个bbox的confidence score，然后根据confidence score对预测得到的98个bbox进行非极大值抑制，得到最终的检测结果。

本节主要摘自： [【目标检测论文阅读】YOLOv1 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/115759795) 



### 3. 精读

#### 3.1. 预测阶段

 <img src="https://i-blog.csdnimg.cn/direct/8ba3b7166ea94998b61f7c7af068f363.png" alt="" style="max-height:1032px; box-sizing:content-box;" />

 <img src="https://i-blog.csdnimg.cn/direct/e4eeffc7384542fe872919a6a0aceadc.png" alt="" style="max-height:1065px; box-sizing:content-box;" />

YOLOv1中S为7，B为2，置信度以框的粗细度表示，越粗表示置信度较高即C越大。

 <img src="https://i-blog.csdnimg.cn/direct/2303a67c88d8476592bf6416f36319b4.png" alt="" style="max-height:531px; box-sizing:content-box;" />

一个框有两个预测框和20个类别的概率，一个预测框有5个中心点位置参数（xywhc），所以一个框有2*5+20个参数。YOLOv1模型类似黑箱，输入448*448的图像，输出1470维的数组即1470个数字。

 <img src="https://i-blog.csdnimg.cn/direct/7f125383648c4be7a3461884e9be4ea0.png" alt="" style="max-height:290px; box-sizing:content-box;" />

 <img src="https://i-blog.csdnimg.cn/direct/56b4919517dd4209a83c9d8d97236c72.png" alt="" style="max-height:276px; box-sizing:content-box;" />

#### 3.2. 预测后处理阶段

 <img src="https://i-blog.csdnimg.cn/direct/9bb58306e0684de3bba695e445e2d18f.png" alt="" style="max-height:499px; box-sizing:content-box;" />

将7*7*30维的张量变成最后的结果

以一个grid cell为例

 <img src="https://i-blog.csdnimg.cn/direct/b868e77529454354ac8dc908ff84b717.png" alt="" style="max-height:492px; box-sizing:content-box;" />

第一个5维↑，第一个预测框

 <img src="https://i-blog.csdnimg.cn/direct/55fc29f818e5473399455e4c099f6b87.png" alt="" style="max-height:317px; box-sizing:content-box;" />

第二个5维↑，第二个预测框

 <img src="https://i-blog.csdnimg.cn/direct/b73a76b9e15940f3b71f38d51c9615be.png" alt="" style="max-height:62px; box-sizing:content-box;" />

 <img src="https://i-blog.csdnimg.cn/direct/6a64b303515e4fe5949447e710f9de35.png" alt="" style="max-height:92px; box-sizing:content-box;" />

后面是20个类别条件概率↑

 <img src="https://i-blog.csdnimg.cn/direct/a7664aae5f534f6b811cacbe0b3bb7ad.png" alt="" style="max-height:317px; box-sizing:content-box;" />

预测框包含物体的概率（即其置信度C）*包含物体条件下的各个类别的概率得到每个类别的真正概率，两个预测框同理。

 <img src="https://i-blog.csdnimg.cn/direct/962a9c3abe3141b6b67f8bdb2a9e8596.png" alt="" style="max-height:311px; box-sizing:content-box;" />

 <img src="https://i-blog.csdnimg.cn/direct/1dd4b260cd834202af1eb6af4f66a535.png" alt="" style="max-height:289px; box-sizing:content-box;" />

上图中间为98个预测框各类别概率的可视化结果，最终如何得到下图的预测结果的呢？

 <img src="https://i-blog.csdnimg.cn/direct/15206d3d9afc409d896493b5f665dc68.png" alt="" style="max-height:357px; box-sizing:content-box;" />

下面是98个预测框各类别的结果得到最终保留预测类别的过程

 <img src="https://i-blog.csdnimg.cn/direct/885e9a1decb04c978c6dbcedcf3b245b.png" alt="" style="max-height:480px; box-sizing:content-box;" />

 <img src="https://i-blog.csdnimg.cn/direct/d6aa2b7f82524be9b77e2b35d77bf065.png" alt="" style="max-height:492px; box-sizing:content-box;" />

若第一个要预测的类别为狗，则以其为例，将每个预测框以预测为狗的概率的大小降序排序，先拿出狗的概率最大的预测框与剩下每个预测框计算IOU，当两个预测框的IOU超过某个值时，只保存概率最大的预测框，另一个概率小的预测概率置为0；若两个预测框的IOU没有超过某个值时，两个预测框都保留。例如上图中bb47与后面每个预测框进行比较，之后再将保留下来的第二高概率值的预测框与剩下的预测框计算IOU进行比较，以此类推，最终结果为下图。

 <img src="https://i-blog.csdnimg.cn/direct/8e0f704a999c491e8a325939e5a20829.png" alt="" style="max-height:506px; box-sizing:content-box;" />

比较完狗之后，再同理比较下一个类别的预测框IOU，直至比较完所有类别，将每个预测框中类别概率不为零的类别用框标识出来。每个grid cell只能预测一个类别，7*7个grid cell最多只能预测49个物体。

 <img src="https://i-blog.csdnimg.cn/direct/d2d39f6c8a5541a9b93df1912ba57eda.png" alt="" style="max-height:499px; box-sizing:content-box;" />

 <img src="https://i-blog.csdnimg.cn/direct/4cf6b7fdecf94c6d968badcaab7a7952.png" alt="" style="max-height:524px; box-sizing:content-box;" />

#### 3.3. 训练阶段（反向传播）

下图是标准的类别框（例如工人标注的），称为ground truth，其中心点落在哪个框中，便由其两个预测框中的一个（和ground truth 的 IOU 较大的一个）去拟合它，另一个什么都不需要做。没有中心点落入的ground cell的两个预测框除了让置信度C越小越好外什么都不需要做。其中ground cell 预测的两个预测框的中心点都在ground cell里面。。

 <img src="https://i-blog.csdnimg.cn/direct/599b304d95dd46f58d7e6959b4a832a2.png" alt="" style="max-height:496px; box-sizing:content-box;" />

；

YOLOv1损失函数有五项：

 <img src="https://i-blog.csdnimg.cn/direct/4863120269b94b7495b990ef0be4dbae.png" alt="" style="max-height:1080px; box-sizing:content-box;" />

五项回归问题（预测出一个连续的值，与标注的值进行比较，越接近越好）的损失函数：

第一项：负责检测物体的bbox（bounding box，预测框）中心点定位误差，残差平方和，其中 $$
1_{ij}^{obj}
$$表示第i个grid cell的第j个bbox是否负责预测物体，若包含则为1，否则为0， $$
\hat{x}
$$和 $$
\hat{y}
$$是标注值，x和y是预测值。

第二项：负责检测物体的bbox宽高误差，加根号使小框对误差更敏感，使大小框造成的损失尽量达到公平。

第三项：负责检测物体bbox的confidence误差。

第四项：不负责检测物体的bbox的confidence误差。

第五项：负责检测物体的grid cell的分类误差。

其中红框意为负责检测物体的bbox，绿框意为不负责检测物体的bbox。

$$
\lambda _{coord}
$$给检测物体的bbox的坐标误差更高的权重即5，给不检测物体的bbox的confidence误差更小的权重即0.5。

前两项是坐标回归误差，三四项是置信度回归误差，第五项是类别预测误差。

注：bbox负责检测物体，则其所属grid cell必然负责检测；一个grid cell中的bbox负责检测物体，则另一个bbox不负责检测物体。

#### 3.4. 细节

 <img src="https://i-blog.csdnimg.cn/direct/748183b928f0408f8f813a4efba52739.png" alt="" style="max-height:996px; box-sizing:content-box;" />

YOLOv1对背景和对象的区分较好，但定为性能较差

 <img src="https://i-blog.csdnimg.cn/direct/aed8da68a1cd4e54814f061ebfb6eb90.png" alt="" style="max-height:980px; box-sizing:content-box;" />

因为一个grid cell只能预测一个类别，所以YOLOv1对小和密集物体的识别性能较差。

本节主要摘自： [YOLOV1作者CVPR2016报告_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV15w411Z7LG/?p=7&spm_id_from=pageDriver&vd_source=7704802197877a956afade15e4bb1c8b) 