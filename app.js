//加载Express模块
const express = require('express');
//加载cors模块
const cors = require('cors');
//加载MySQL模块
const mysql = require('mysql');
//加载body-parser模块
const bodyParser = require('body-parser');
// 加载Multer模块
const multer = require('multer');
//加载fs模块(FileSystem)
const fs = require('fs');
// 加载uuid模块
const uuid = require('uuid');
const { json } = require('body-parser');
//创建MySQL连接池
const pool = mysql.createPool({
  //MySQL数据库服务器的地址
  host: '127.0.0.1',
  //MySQL数据库服务器端口号
  port: 3306,
  //用户名
  user: 'root',
  //密码
  password: '',
  //数据库名称
  database: 'idong'
});

//创建Express应用
const server = express();

//使用cors模块
server.use(cors({
  origin: ['http://127.0.0.1:8080', 'http://localhost:8080']
}));

//使用body-parser模块
server.use(bodyParser.urlencoded({
  extended: false
}));

//获取文章分类信息的API
server.get('/category', (req, res) => {

  //查询ency_category(文章类型)表中所有的记录 
  var sql = 'SELECT ency_category_id,ency_category_name FROM ency_category';

  // MySQL连接池执行查询操作
  pool.query(sql, (err, results) => {

    //如果发生异常,则直接抛出异常
    if (err) throw err;

    //将相关的查询信息返回到客户端
    res.send({ message: '查询成功', code: 200, category: results });

  });

});

// /**
//  * 
//  *  功能：
//  *     表 ency_article
//  * 
//  *       1 问标题 article_title
//  *       2 文章阅读人数 read_count
//  *       3 图片 article_image
//  *       
//  *  参数： 
//  *       cid  active选项卡（ency_category_id 对应数据库类别id）  类别
//  *       page 页数
//  *  著作：
//  * 
//  * */
// server.get('/getArticles', (req, res) => {
//   //获取参数
//   var active = req.query.cid;
//   var page = req.query.page;
//   console.log(active);
//   console.log(page);
//   //查询sql 根据参数 active 获取出来  1 问标题 2 文章阅读人数 3 图片

// // 根据类别和页数 取出对应的 内容
// //   select e.article_title,e.read_count,e.article_image from ency_article e where e.ency_category_id = 5 



//   //响应结果
// })



/**
 * 
 *  功能：
 *       1 问标题
 *       2 文章阅读人数
 *       3 图片
 * 
 *  参数： 
 *       active选项卡（ency_category_id 对应数据库类别id）
 *       page 页数
 *  著作：
 * 
 * */
server.get('/getArticles', (req, res) => {
  //获取地址栏请求参数 -- cid(文章分类ID)
  var cid = req.query.cid;
  //获取地址栏请求参数 -- page(当前页码)
  var page = req.query.page;
  //设置每页显示的记录数
  var pagesize = 20;
  //存储计算后的分页总页数
  var pagecount;
  //查询某一文章分类包含的文章总数
  var sql = 'SELECT COUNT(article_id) AS count FROM ency_article WHERE ency_category_id=?';
  pool.query(sql, [cid], (err, results) => {
    if (err) throw err;
    pagecount = Math.ceil(results[0].count / pagesize);
  });
  //页码应该是滚动触发loadMore()函数时提交给服务器
  var offset = (page - 1) * pagesize;
  // console.log(offset)
  
  //以获取到的cid参数为条件查询该分类下的文章信息
  sql = 'SELECT DISTINCT e.ency_category_id,e.article_id,e.article_title,e.read_count,e.article_image,(select count(*) from article_collect a where   a.collect_upid = e.article_id and collect_type = 2) as coll FROM  ency_article e   left join article_collect a ON e.article_id = collect_upid WHERE e.ency_category_id=? order by read_count desc LIMIT ' + offset + ',' + pagesize ;

  //执行SQL查询
  pool.query(sql, [cid], (err, results) => {

    if (err) throw err;
    // console.log(results)
    res.send({message:'查询成功',code:200,articles:results,pagecount:pagecount});
    // aa = results

  });


});

//根据ID获取文章信息的API
server.get('/encyArticle', (req, res) => {

  //获取URL地址栏的参数
  var id = req.query.id;
  // console.log(id)
  //根据ID查询指定文章的SQL
  var sql = 'SELECT article_title,article_content,article_at,read_count FROM ency_article WHERE article_id=?';
  pool.query(sql, [id], (err, results) => {

    if (err) throw err;
    res.send({ message: '查询成功', code: 200, encyArticle: results[0] });

  });

});

//获取收藏文章的人数
server.post('/getColl', (req, res) => {
  // var coll = req.query.
  var sql = 'select * from article_collect WHERE collect_type=2 and collect_upid=?';
  pool.query(sql, [coll], (err, results) => {
    if (err) throw err;
    res.send({ message: '查询成功', code: 200, });
  });

});

//修改文章阅读量
server.post('/setRead', (req, res) => {
  var id = req.query.id;
  var read_count = req.query.read_count;
  var sql_setRead = 'UPDATE ency_article set read_count=? where article_id=?';
  pool.query(sql_setRead, [read_count, id], (err, results) => {

    if (err) throw err;
    res.send({ message: '查询成功', code: 200, setRead: results[0] });

  });
})

//用户注册API
server.post('/register', (req, res) => {
  //获取用户的注册信息
  var username = req.body.username;
  var password = md5(req.body.password);

  //查询是否存在输入的用户名,如果不存在,则将数据写入到数据表
  //如果存在,则返回错误信息给客户端
  var sql = "SELECT COUNT(id) AS count FROM xzqa_author WHERE username=?";
  pool.query(sql, [username], (err, results) => {
    if (err) throw err;
    //用户已经存在
    if (results[0].count == 1) {
      res.send({ message: '注册失败', code: 201 })
    } else {
      //将获取到的用户信息写入到数据表
      sql = 'INSERT xzqa_author(username,password) VALUES(?,?)';
      pool.query(sql, [username, password], (err, results) => {
        if (err) throw err;
        res.send({ message: '注册成功', code: 200 });
      });
    }
  })

});

//用户登录API
server.post('/login', (req, res) => {
  //获取用户登录的信息
  var username = req.body.username;
  var password = md5(req.body.password);
  //以用户名和密码为条件进行查找
  var sql = "SELECT id,username FROM xzqa_author WHERE username=? AND password=?";
  pool.query(sql, [username, password], (err, results) => {
    if (err) throw err;
    if (results.length == 0) {
      res.send({ message: '登录失败', code: 202 });
    } else {
      res.send({ message: '登录成功', code: 200, info: results[0] });
    }
  });
});



// 自定义存储规则
var storagePost = multer.diskStorage({
  destination: function (req, file, cb) {
    path = 'upload';
    // 构建Date对象
    var now = new Date();
    var fullYear = now.getFullYear();
    var month = now.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    var day = now.getDate();
    day = day < 10 ? '0' + day : day;
    cb(null, path);
  },
  filename: function (req, file, cb) {
    // 获取上传文件的原始名称
    var extension = file.originalname.substr(file.originalname.lastIndexOf('.') + 1).toLowerCase();
    // a.jpg a为主文件名称 .  jpg为扩展名
    var mainname = uuid.v1();
    filename = mainname + '.' + extension;
    cb(null, filename);
  }
});
uploadPost = multer({ storage: storagePost });



// 传单张图片
server.post('/postImg', uploadPost.single('file'), (req, res) => {
  //接收前台POST过来的base64
  var base64 = req.body.Base64Str;
  var fileType = req.body.AttachmentType;
  var base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  // console.log(base64,fileType);
  //过滤data:URL
  var dataBuffer = new Buffer(base64Data, 'base64');
  // 图片名称
  var filename = uuid.v1() + '.' + fileType;
  var path = `./public/images/post/${filename}`;
  fs.writeFile(path, dataBuffer, (err) => {
    if (err) {
      res.send(err);
    } else {
      res.send({ code: 200, filename: filename });
    }
  });
});


// 发布动态
server.post('/postcontent', (req, res) => {
  var user_id = req.body.user_id;
  var content = req.body.Subject;
  var file = req.body.Files;
})


/**
 * 
 * 
 * 
 */
// 获取动态信息
server.get('/getPosts', (req, res) => {
  // 获取地址栏请求的参数---page(当前页码)
  var page = req.query.page;
  // 设置每页显示的记录数
  var pagesize = 3;
  // 页码应该是滚动触发loadMore函数时提交给服务器
  var offset = (page - 1) * pagesize;
  // 存储计算后的分页总页数
  var pagecount = 0;
  // 存储要返回给前端的对象
  let postObj = [];

  // 查询数据库动态表中动态总数
  var sql = `SELECT COUNT(post_id) AS count FROM user_post`;
  pool.query(sql, (err, results) => {
    if (err) throw err;
    pagecount = Math.ceil(results[0].count / pagesize);
  });
  // 获取从下标offset开始 取pagesize条动态的信息
  var sql = `SELECT post_id,user_id,post_content,post_at,post_img_num FROM user_post LIMIT ${offset},${pagesize}`;
  pool.query(sql, (err, results) => {
    if (err) throw err;
    postObj = copyFn(results);
    // console.log(postObj[0]);
    // res.send({messgae:'查询成功',code:200,articles:results,pagecount:pagecount});

    // 查询各个动态下的图片
    for (let i = 0; i < pagesize; i++) {
      var sql = `SELECT img_id,img_name,img_oid FROM user_img WHERE post_id=?`;
      pool.query(sql, [postObj[i].post_id], (err, results) => {
        if (err) throw err;
        // console.log(copyFn(results));
        postObj[i].imgs = copyFn(results);
        // postObj[i].imgs[i] = copyFn(results);
        // console.log(postObj[i]);
        // console.log(i);
        // console.log(postObj[i]);
        // console.log("---------------");
        // res.send({messgae:'查询成功',code:200,articles:results,pagecount:pagecount});
      });
    }
    console.log(postObj[0]);
  });
})

// server.listen(9001);
server.listen(9001,()=>{
  console.log('8000端口监听中。。。。');
})

// 对象的深克隆
function copyFn(obj) {
  if (obj == null) { return null }
  var result = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object') {
        result[key] = copyFn(obj[key]); // 如果是对象，再次调用该方法自身 
      } else {
        result[key] = obj[key];
      }
    }
  }
  return result;
}