﻿using UnityEngine;
using UnityEditor;
using System.Collections;
using System.Collections.Generic;
using System.Text;

public class ExcelTools : EditorWindow
{
    /// <summary>
    /// 当前编辑器窗口实例
    /// </summary>
    private static ExcelTools instance;

    /// <summary>
    /// Excel文件列表
    /// </summary>
    private static List<string> excelList;

    /// <summary>
    /// 项目根路径	
    /// </summary>
    private static string pathRoot;

    /// <summary>
    /// 滚动窗口初始位置
    /// </summary>
    private static Vector2 scrollPos;

    /// <summary>
    /// 输出格式索引
    /// </summary>
    private static int indexOfFormat = 0;

    /// <summary>
    /// 输出格式
    /// </summary>
    private static readonly string[] formatOption = new string[] { "TYPESCRIPT", "JSON", "CSV" };

    /// <summary>
    /// 编码索引
    /// </summary>
    private static int indexOfEncoding = 0;

    /// <summary>
    /// 编码选项
    /// </summary>
    private static readonly string[] encodingOption = new string[] { "UTF-8" };//,"GB2312"

    /// <summary>
    /// 是否保留原始文件
    /// </summary>
    private static bool keepSource = true;



    /// <summary>
    /// 是否保留原始文件
    /// </summary>
    private static string ClientOutPath = "/Scripts/Data/";
    private static string ServerOutPath = "/World.multiplay/Data/";

    /// <summary>
    /// 显示当前窗口	
    /// </summary>
    [MenuItem("Tool/ExcelTools")]
    static void ShowExcelTools()
    {
        Init();
        //加载Excel文件
        LoadExcel();
        instance.Show();
    }

    void OnGUI()
    {
        DrawOptions();
        DrawExport();
    }

    /// <summary>
    /// 绘制插件界面配置项
    /// </summary>
    private void DrawOptions()
    {
        GUILayout.BeginHorizontal();
        EditorGUILayout.LabelField("Format type:", GUILayout.Width(85));
        indexOfFormat = EditorGUILayout.Popup(indexOfFormat, formatOption, GUILayout.Width(125));
        GUILayout.EndHorizontal();

        GUILayout.BeginHorizontal();
        EditorGUILayout.LabelField("Encoding type:", GUILayout.Width(85));
        indexOfEncoding = EditorGUILayout.Popup(indexOfEncoding, encodingOption, GUILayout.Width(125));
        GUILayout.EndHorizontal();

        EditorGUILayout.LabelField("Client output path: " + ClientOutPath);
        EditorGUILayout.LabelField("Server output path: " + ServerOutPath);
        // keepSource = GUILayout.Toggle(keepSource, "保留Excel源文件");
    }

    /// <summary>
    /// 绘制插件界面输出项
    /// </summary>
    private void DrawExport()
    {

        if (excelList == null) return;
        if (excelList.Count < 1)
        {
            EditorGUILayout.LabelField("No Excel files selected!");

        }
        else
        {
            EditorGUILayout.LabelField("The following files will be converted to" + formatOption[indexOfFormat] + ":");
            GUILayout.BeginVertical();
            scrollPos = GUILayout.BeginScrollView(scrollPos, false, true, GUILayout.Height(150));
            foreach (string s in excelList)
            {
                GUILayout.BeginHorizontal();
                GUILayout.Toggle(true, s);
                GUILayout.EndHorizontal();
            }
            GUILayout.EndScrollView();
            GUILayout.EndVertical();

            //输出
            if (GUILayout.Button("Output to client"))
            {
                Convert(ClientOutPath);
            }
            if (GUILayout.Button("Output to server"))
            {
                Convert(ServerOutPath);
            }
        }
    }

    /// <summary>
    /// 转换Excel文件
    /// </summary>
    private static void Convert(string outPath)
    {
        foreach (string assetsPath in excelList)
        {
            //获取Excel文件的绝对路径
            string excelPath = pathRoot + "/" + assetsPath;
            //构造Excel工具类
            ExcelUtility excel = new ExcelUtility(excelPath);

            //判断编码类型
            Encoding encoding = null;
            if (indexOfEncoding == 0 || indexOfEncoding == 3)
            {
                encoding = Encoding.GetEncoding("utf-8");
            }
            else if (indexOfEncoding == 1)
            {
                encoding = Encoding.GetEncoding("gb2312");
            }

            //判断输出类型
            string output = "";
            if (indexOfFormat == 0)
            {
                output = excelPath.Replace(".xlsx", ".ts");
                excel.ConvertToTs(output, encoding, outPath);
            }
            else if (indexOfFormat == 1)
            {
                output = excelPath.Replace(".xlsx", ".json");
                excel.ConvertToJson(output, encoding, outPath);
            }
            else if (indexOfFormat == 2)
            {
                output = excelPath.Replace(".xlsx", ".csv");
                excel.ConvertToCSV(output, encoding, outPath);
            }
            else if (indexOfFormat == 3)
            {
                output = excelPath.Replace(".xlsx", ".xml");
                excel.ConvertToXml(output, outPath);
            }
            else if (indexOfFormat == 4)
            {
                output = excelPath.Replace(".xlsx", ".lua");
                excel.ConvertToLua(output, encoding, outPath);
            }


            //判断是否保留源文件
            if (!keepSource)
            {
                FileUtil.DeleteFileOrDirectory(excelPath);
            }

            //刷新本地资源
            AssetDatabase.Refresh();
        }

        //转换完后关闭插件
        //这样做是为了解决窗口
        //再次点击时路径错误的Bug
        // instance.Close();

    }

    /// <summary>
    /// 加载Excel
    /// </summary>
    private static void LoadExcel()
    {
        if (excelList == null) excelList = new List<string>();
        excelList.Clear();
        //获取选中的对象
        object[] selection = (object[])Selection.objects;
        //判断是否有对象被选中
        if (selection.Length == 0)
            return;
        //遍历每一个对象判断不是Excel文件
        foreach (Object obj in selection)
        {
            string objPath = AssetDatabase.GetAssetPath(obj);
            if (objPath.EndsWith(".xlsx"))
            {
                excelList.Add(objPath);
            }
        }
    }

    private static void Init()
    {

        //获取当前实例
        instance = EditorWindow.GetWindow<ExcelTools>();
        //初始化
        pathRoot = Application.dataPath;
        //注意这里需要对路径进行处理
        //目的是去除Assets这部分字符以获取项目目录
        //我表示Windows的/符号一直没有搞懂
        pathRoot = pathRoot.Substring(0, pathRoot.LastIndexOf("/"));
        excelList = new List<string>();
        scrollPos = new Vector2(instance.position.x, instance.position.y + 75);
    }

    void OnSelectionChange()
    {
        //当选择发生变化时重绘窗体
        Show();
        LoadExcel();
        Repaint();
    }
}
