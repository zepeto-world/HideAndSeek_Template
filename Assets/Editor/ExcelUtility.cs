using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Excel;
using System.Data;
using System.IO;
using Newtonsoft.Json;
using System.Text;
using System.Reflection;
using System.Reflection.Emit;
using System;
using System.Linq;
using System.Xml;
public class ExcelUtility
{

    /// <summary>
    /// 表格数据集合
    /// </summary>
    private DataSet mResultSet;

    private string xmlPath = Application.dataPath + "/xmlName.xml";

    private string[] fName;
    /// <summary>
    /// 构造函数
    /// </summary>
    /// <param name="excelFile">Excel file.</param>
    public ExcelUtility(string excelFile)
    {
        FileStream mStream = File.Open(excelFile, FileMode.Open, FileAccess.Read);
        IExcelDataReader mExcelReader = ExcelReaderFactory.CreateOpenXmlReader(mStream);
        mResultSet = mExcelReader.AsDataSet();
    }

    /// <summary>
    /// 转换为实体类列表
    /// </summary>
    public List<T> ConvertToList<T>()
    {
        //判断Excel文件中是否存在数据表
        if (mResultSet.Tables.Count < 1)
            return null;
        //默认读取第一个数据表
        DataTable mSheet = mResultSet.Tables[0];

        //判断数据表内是否存在数据
        if (mSheet.Rows.Count < 1)
            return null;

        //读取数据表行数和列数
        int rowCount = mSheet.Rows.Count;
        int colCount = mSheet.Columns.Count;

        //准备一个列表以保存全部数据
        List<T> list = new List<T>();

        //读取数据
        for (int i = 1; i < rowCount; i++)
        {
            //创建实例
            Type t = typeof(T);
            ConstructorInfo ct = t.GetConstructor(System.Type.EmptyTypes);
            T target = (T)ct.Invoke(null);
            for (int j = 0; j < colCount; j++)
            {
                //读取第1行数据作为表头字段
                string field = mSheet.Rows[0][j].ToString();
                object value = mSheet.Rows[i][j];
                //设置属性值
                SetTargetProperty(target, field, value);
            }

            //添加至列表
            list.Add(target);
        }

        return list;
    }

    /// <summary>
    /// 转换为Json
    /// </summary>
    /// <param name="JsonPath">Json文件路径</param>
    /// <param name="Header">表头行数</param>
    public void ConvertToJson(string JsonPath, Encoding encoding, string outPath)
    {
        //判断Excel文件中是否存在数据表
        if (mResultSet.Tables.Count < 1)
            return;

        //默认读取第一个数据表
        DataTable mSheet = mResultSet.Tables[0];

        //判断数据表内是否存在数据
        if (mSheet.Rows.Count < 1)
            return;

        //读取数据表行数和列数
        int rowCount = mSheet.Rows.Count;
        int colCount = mSheet.Columns.Count;

        //准备一个列表存储整个表的数据
        List<Dictionary<string, object>> table = new List<Dictionary<string, object>>();

        //读取数据
        for (int i = 1; i < rowCount; i++)
        {
            //准备一个字典存储每一行的数据
            Dictionary<string, object> row = new Dictionary<string, object>();
            for (int j = 0; j < colCount; j++)
            {
                //读取第1行数据作为表头字段
                string field = mSheet.Rows[0][j].ToString();
                //Key-Value对应
                row[field] = mSheet.Rows[i][j];
            }

            //添加到表数据中
            table.Add(row);
        }

        //生成Json字符串
        string json = JsonConvert.SerializeObject(table, Newtonsoft.Json.Formatting.Indented);
        //写入文件
        using (FileStream fileStream = new FileStream(JsonPath, FileMode.Create, FileAccess.Write))
        {
            using (TextWriter textWriter = new StreamWriter(fileStream, encoding))
            {
                textWriter.Write(json);
            }
        }
    }

    /// <summary>
	/// 转换为lua
	/// </summary>
	/// <param name="luaPath">lua文件路径</param>
	public void ConvertToLua(string luaPath, Encoding encoding, string outPath)
    {
        //判断Excel文件中是否存在数据表
        if (mResultSet.Tables.Count < 1)
            return;

        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.Append("local datas = {");
        stringBuilder.Append("\r\n");

        //读取数据表
        foreach (DataTable mSheet in mResultSet.Tables)
        {
            //判断数据表内是否存在数据
            if (mSheet.Rows.Count < 1)
                continue;

            //读取数据表行数和列数
            int rowCount = mSheet.Rows.Count;
            int colCount = mSheet.Columns.Count;

            //准备一个列表存储整个表的数据
            List<Dictionary<string, object>> table = new List<Dictionary<string, object>>();

            //读取数据
            for (int i = 1; i < rowCount; i++)
            {
                //准备一个字典存储每一行的数据
                Dictionary<string, object> row = new Dictionary<string, object>();
                for (int j = 0; j < colCount; j++)
                {
                    //读取第1行数据作为表头字段
                    string field = mSheet.Rows[0][j].ToString();
                    //Key-Value对应
                    row[field] = mSheet.Rows[i][j];
                }
                //添加到表数据中
                table.Add(row);
            }

            stringBuilder.Append(string.Format("\t\"{0}\" = ", mSheet.TableName));
            stringBuilder.Append("{\r\n");
            foreach (Dictionary<string, object> dic in table)
            {
                stringBuilder.Append("\t\t{\r\n");
                foreach (string key in dic.Keys)
                {
                    if (dic[key].GetType().Name == "String")
                        stringBuilder.Append(string.Format("\t\t\t\"{0}\" = \"{1}\",\r\n", key, dic[key]));
                    else
                        stringBuilder.Append(string.Format("\t\t\t\"{0}\" = {1},\r\n", key, dic[key]));
                }
                stringBuilder.Append("\t\t},\r\n");
            }
            stringBuilder.Append("\t}\r\n");
        }

        stringBuilder.Append("}\r\n");
        stringBuilder.Append("return datas");

        //写入文件
        using (FileStream fileStream = new FileStream(luaPath, FileMode.Create, FileAccess.Write))
        {
            using (TextWriter textWriter = new StreamWriter(fileStream, encoding))
            {
                textWriter.Write(stringBuilder.ToString());
            }
        }
    }

    /// <summary>
    /// 转换为lua
    /// </summary>
    /// <param name="luaPath">lua文件路径</param>
    public void ConvertToTs(string luaPath, Encoding encoding, string outPath)
    {

        //判断Excel文件中是否存在数据表
        if (mResultSet.Tables.Count < 1)
            return;

        StringBuilder stringBuilder = new StringBuilder();


        //读取数据表
        foreach (DataTable mSheet in mResultSet.Tables)
        {
            //判断数据表内是否存在数据
            if (mSheet.Rows.Count < 1)
                continue;

            //读取数据表行数和列数
            int rowCount = mSheet.Rows.Count;
            int colCount = mSheet.Columns.Count;


            //准备一个列表存储整个表的数据
            List<Dictionary<string, object>> table = new List<Dictionary<string, object>>();

            //读取数据
            for (int i = 1; i < rowCount; i++)
            {
                //准备一个字典存储每一行的数据
                Dictionary<string, object> row = new Dictionary<string, object>();
                for (int j = 0; j < colCount; j++)
                {
                    //读取第1行数据作为表头字段
                    string field = mSheet.Rows[0][j].ToString();
                    //Key-Value对应
                    row[field] = mSheet.Rows[i][j];
                }
                //添加到表数据中
                table.Add(row);
            }
            Debug.Log("ConvertToTs:" + mSheet.TableName);
            stringBuilder.Append(string.Format("export class {0} ", mSheet.TableName));
            stringBuilder.Append("{\r\n");
            // stringBuilder.Append(string.Format("\t\n public {0}Map : Map<string,Object>", mSheet.TableName));
            foreach (Dictionary<string, object> dic in table)
            {
                foreach (string key in dic.Keys)
                {
                    Debug.Log(key + ":" + dic[key].GetType().Name);
                    if (dic[key].GetType().Name == "String")
                    {
                        stringBuilder.Append(string.Format("\tpublic {0}: string;\r\n", key, dic[key]));
                    }
                    else if (dic[key].GetType().Name == "Double")
                    {
                        stringBuilder.Append(string.Format("\tpublic {0}: number;\r\n", key, dic[key]));
                    }
                }
                break;
            }
            stringBuilder.Append("}\r\n");

            //生成MAP
            int MapIdx = 0;
            string sTableInter = string.Format("{0}Map", mSheet.TableName);
            stringBuilder.Append("export class " + sTableInter);
            stringBuilder.Append(" {\r\n");
            var tableFirstRow = table.First<Dictionary<string, object>>();
            var firstValue = tableFirstRow.First().Value;
            if (firstValue.GetType().Name == "Double")
            {
                stringBuilder.Append(string.Format("\tpublic data: Map<number, {0}> = new Map<number, {0}>()\n", mSheet.TableName));
            }
            else
            {
                stringBuilder.Append(string.Format("\tpublic data: Map<string, {0}> = new Map<string, {0}>()\n", mSheet.TableName));
            }
            stringBuilder.Append("\tconstructor() {\n");

            // stringBuilder.Append(string.Format("\t\tlet rowCnt =  {0}; \n", rowCount - 1));
            // stringBuilder.Append("\t\tfor(let i = 0;i< rowCnt ;i++) {\n");
            stringBuilder.Append(string.Format("\t\tlet tempData: {0};\n", mSheet.TableName));
            foreach (Dictionary<string, object> dic in table)
            {
                stringBuilder.Append(string.Format("\t\ttempData = new {0};\n", mSheet.TableName));
                MapIdx = 0;

                foreach (string key in dic.Keys)
                {
                    if (dic[key].GetType().Name == "String")
                    {
                        stringBuilder.Append(string.Format("\t\ttempData.{1} = \"{2}\";\n", sTableInter, key, dic[key], sTableInter));
                    }
                    else if (dic[key].GetType().Name == "Double")
                    {
                        stringBuilder.Append(string.Format("\t\ttempData.{1} = {2};\n", sTableInter, key, dic[key], sTableInter));
                    }
                    MapIdx++;
                }
                stringBuilder.Append(string.Format("\t\tthis.data.set(tempData.id, tempData);\n", sTableInter));
            }

            // stringBuilder.Append("\t\t}\r\n");
            stringBuilder.Append("\t}\r\n");
            stringBuilder.Append("}\r\n");
        }


        Debug.Log("Write to file");
        var originPath = Application.dataPath + "/Resources/Excel/";
        var fileName = luaPath.Replace(originPath, "");
        var targetPath = Application.dataPath + outPath + fileName;
        Debug.Log("output path: " + targetPath);
        using (FileStream fileStream = new FileStream(targetPath, FileMode.Create, FileAccess.Write))
        {
            using (TextWriter textWriter = new StreamWriter(fileStream, encoding))
            {
                textWriter.Write(stringBuilder.ToString());
            }
        }
    }


    /// <summary>
    /// 转换为CSV
    /// </summary>
    public void ConvertToCSV(string CSVPath, Encoding encoding, string outPath)
    {
        //判断Excel文件中是否存在数据表
        if (mResultSet.Tables.Count < 1)
            return;

        //默认读取第一个数据表
        DataTable mSheet = mResultSet.Tables[0];

        //判断数据表内是否存在数据
        if (mSheet.Rows.Count < 1)
            return;

        //读取数据表行数和列数
        int rowCount = mSheet.Rows.Count;
        int colCount = mSheet.Columns.Count;

        //创建一个StringBuilder存储数据
        StringBuilder stringBuilder = new StringBuilder();

        //读取数据
        for (int i = 0; i < rowCount; i++)
        {
            for (int j = 0; j < colCount; j++)
            {
                //使用","分割每一个数值
                stringBuilder.Append(mSheet.Rows[i][j] + ",");
            }
            //使用换行符分割每一行
            stringBuilder.Append("\r\n");
        }

        //写入文件
        using (FileStream fileStream = new FileStream(CSVPath, FileMode.Create, FileAccess.Write))
        {
            using (TextWriter textWriter = new StreamWriter(fileStream, encoding))
            {
                textWriter.Write(stringBuilder.ToString());
            }
        }
    }

    List<string> mList = new List<string>();
    List<string> sList = new List<string>();
    public void ReadXmlName()
    {
        XmlDocument xmlDoc = new XmlDocument();
        xmlDoc.Load(xmlPath);
        int rootlist = xmlDoc.GetElementsByTagName("root")[0].ChildNodes.Count;

        XmlNodeList nodeList = xmlDoc.SelectSingleNode("root").ChildNodes;

        for (int k = 0; k < rootlist; k++)
        {
            mList.Add(xmlDoc.GetElementsByTagName("root")[0].ChildNodes[k].Name);

        }


        foreach (XmlElement xe in nodeList)
        {

            foreach (XmlElement x1 in xe.ChildNodes)
            {
                sList.Add(x1.InnerText);
            }
        }

    }



    /// <summary>
	/// 导出为Xml
	/// </summary>
	public void ConvertToXml(string XmlFile, string outPath)
    {
        ReadXmlName();
        FileInfo info = new FileInfo(XmlFile);
        string xname = info.Name.Replace(".xlsx", "");

        //string Jname = XmlFile.Replace("C:/Users/dell/Desktop/New Unity Project/Assets/Excel/", "");
        //Debug.Log(Jname);
        //判断Excel文件中是否存在数据表
        if (mResultSet.Tables.Count < 1)
            return;

        //默认读取第一个数据表
        DataTable mSheet = mResultSet.Tables[0];
        string Zz = @"[\u4e00-\u9fa5]";
        //判断数据表内是否存在数据
        if (mSheet.Rows.Count < 1)
            return;

        //读取数据表行数和列数
        int rowCount = mSheet.Rows.Count;
        int colCount = mSheet.Columns.Count;






        //创建一个StringBuilder存储数据
        StringBuilder stringBuilder = new StringBuilder();
        //创建Xml文件头
        stringBuilder.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
        stringBuilder.Append("\r\n");
        //创建根节点
        stringBuilder.Append("<root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">");
        stringBuilder.Append("\r\n");
        //读取数据



        for (int i = 1; i < rowCount; i++)
        {
            //创建子节点
            for (int a = 0; a < mList.Count; a++)
            {
                if (xname == mList[a])
                {
                    stringBuilder.Append("\t<" + sList[a] + ">");
                    stringBuilder.Append("\r\n");
                }
            }



            for (int j = 0; j < colCount; j++)
            {
                if (System.Text.RegularExpressions.Regex.IsMatch(mSheet.Rows[0][j].ToString(), Zz) || string.IsNullOrEmpty(mSheet.Rows[0][j].ToString()))
                {
                    continue;
                }

                else
                {

                    if (string.IsNullOrEmpty(mSheet.Rows[i][j].ToString()) && xname.Contains("Name"))
                    {

                        stringBuilder.Append("<" + mSheet.Rows[0][j].ToString() + "/>");
                        stringBuilder.Append("\r\n");
                        continue;
                    }
                    else if (string.IsNullOrEmpty(mSheet.Rows[i][j].ToString()))
                    {

                        continue;
                    }
                    else
                    {
                        stringBuilder.Append("\t\t<" + mSheet.Rows[0][j].ToString() + ">");
                        stringBuilder.Append(mSheet.Rows[i][j].ToString());
                        stringBuilder.Append("</" + mSheet.Rows[0][j].ToString() + ">");
                        stringBuilder.Append("\r\n");
                    }

                }

            }
            //使用换行符分割每一行
            for (int a = 0; a < mList.Count; a++)
            {
                if (xname == mList[a])
                {
                    stringBuilder.Append("\t</" + sList[a] + ">");
                    stringBuilder.Append("\r\n");
                }
            }

        }
        //闭合标签
        stringBuilder.Append("</root>");
        //写入文件
        using (FileStream fileStream = new FileStream(XmlFile, FileMode.Create, FileAccess.Write))
        {
            using (TextWriter textWriter = new StreamWriter(fileStream, Encoding.GetEncoding("utf-8")))
            {
                textWriter.Write(stringBuilder.ToString());
            }
        }
    }

    /// <summary>
    /// 设置目标实例的属性
    /// </summary>
    private void SetTargetProperty(object target, string propertyName, object propertyValue)
    {
        //获取类型
        Type mType = target.GetType();
        //获取属性集合
        PropertyInfo[] mPropertys = mType.GetProperties();
        foreach (PropertyInfo property in mPropertys)
        {
            if (property.Name == propertyName)
            {
                property.SetValue(target, Convert.ChangeType(propertyValue, property.PropertyType), null);
            }
        }
    }
}


