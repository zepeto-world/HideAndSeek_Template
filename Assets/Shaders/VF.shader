Shader "AXShader/WallShadow"
{
    Properties
    {
        _Color ("Color",Color) = (1,1,1,1)
        _MainTex ("Texture", 2D) = "white" {}
        _SpecularColor ("SpecularColor",Color) = (1,1,1,1)
        _Gloss ("Gloss",Range(8.0,255)) = 20

        _HideColor ("HideColor",Color) = (1,1,1,1)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Transparent"}

        //主要Pass，用于实现遮挡显示。
        Pass
        {
            ZWrite Off
            ZTest Greater
            Blend SrcAlpha OneMinusSrcColor
            //Cull Front
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Lighting.cginc"
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float3 worldPos : TEXCOORD1;
                float3 worldNormal : TEXCOORD2;
                float4 vertex : SV_POSITION;
            };

            fixed4 _HideColor; 

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                
                o.worldPos = mul(unity_ObjectToWorld,v.vertex).xyz;
                o.worldNormal = UnityObjectToWorldNormal(v.normal);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                fixed3 ViewDir = normalize(UnityWorldSpaceViewDir(i.worldPos));
                fixed3 normalDir = normalize(i.worldNormal);

                //计算边缘光，利用法线和视角向量的点乘值判断该面是在视线正前方还是侧面
                //点乘值越大，说明余弦值越接近1，二者夹角越接近重合。减法计算后结果为0判断其为视线正前方
                fixed3 rim = 1.0 - saturate(dot(normalDir,ViewDir));                
                return fixed4(rim * _HideColor.rgb,1.0);
            }
            ENDCG
        }


        //该Pass用来绘制正常状态
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Lighting.cginc"
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float3 worldPos : TEXCOORD1;
                float3 worldNormal : TEXCOORD2;
                float4 vertex : SV_POSITION;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            fixed4 _Color;
            fixed _Gloss;
            fixed4 _SpecularColor; 

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                o.worldPos = mul(unity_ObjectToWorld,v.vertex).xyz;
                o.worldNormal = UnityObjectToWorldNormal(v.normal);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                fixed3 lightDir = normalize(UnityWorldSpaceLightDir(i.worldPos));
                fixed3 ViewDir = normalize(UnityWorldSpaceViewDir(i.worldPos));
                fixed3 normalDir = normalize(i.worldNormal);

                fixed3 albedo = tex2D(_MainTex, i.uv).rgb * _Color.rgb;
                fixed3 halfDir = normalize(ViewDir+lightDir);

                fixed3 ambient = UNITY_LIGHTMODEL_AMBIENT.xyz * albedo;
                fixed3 diffuse = _LightColor0.rgb * albedo * saturate(dot(normalDir,lightDir));
                fixed3 specular = _LightColor0.rgb * _SpecularColor.rgb * pow(saturate(dot(normalDir,halfDir)),_Gloss);
                fixed3 col = ambient + diffuse + specular;
                return fixed4(col,1.0);
            }
            ENDCG
        }
    }
}
