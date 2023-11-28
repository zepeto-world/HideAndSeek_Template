Shader "Wit/Fur_js" {
	Properties {
		_Color ("Color", Color) = (1, 1, 1, 1)
		_MainTex ("Albedo (RGB)", 2D) = "white" {}
		

		_Glossiness ("Glossiness", Range(0,1)) = 0.5
		_Shininess ("Shininess", Range(0,1)) = 0.0
		[Space][Space][Space][Space][Space]
			
		

		[NOScaleOffset]_BumpMap ("NormalMap", 2D) = "bump"{}
		_NormalTiling("NormalTiling", range(1, 50)) = 1
		_NormalPower("NormalPower", range(0,3)) = 1
		
		[Space][Space][Space][Space][Space]
        //rim lighting variables
        _RimColor("RimColor", Color) = (1,1,1,1) //color of rim lighting
        _RimPower("RimPower", Float) = 1 //intensity of rim lighting

		_AlphaOutline("AlphaOutline", Range(0, 10)) = 1
		_AlphaPower("AlphaPower", Range(0, 10)) = 1
		_furOffset("furOffset", Range(0, 0.05)) = 0
		//_furOffset2("furOffset2", Range(0, 0.005)) = 0

		[HideInInspector]_LogLut ("_LogLut", 2D)  = "white" {}

	}
	SubShader {
		Tags { "RenderType" = "Opaque"  "Queue" = "Geometry" }
		LOD 200

		CGPROGRAM
		#pragma surface surf StandardSpecular finalcolor:tonemapping //vertex:vert
		#include "ToneMapping.cginc"

		sampler2D _MainTex;
		sampler2D _BumpMap;

        half4 _RimColor;
        float _RimPower;


		struct Input {
			float2 uv_MainTex;
			float2 uv_BumpMap;
			float3 viewDir;
			float3 worldNormal; INTERNAL_DATA
		};

		half _Glossiness, _Shininess;
		fixed4 _Color;
		fixed _NormalPower, _NormalTiling;



		void surf (Input IN, inout SurfaceOutputStandardSpecular o) {
			// Albedo comes from a texture tinted by color
			fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
						
			
			//Metallic and smoothness come from slider variables
			o.Smoothness = _Glossiness;
			o.Specular = _Shininess;
			fixed3 nm = UnpackNormal(tex2D(_BumpMap, fixed2(IN.uv_MainTex.x * _NormalTiling, IN.uv_MainTex.y * _NormalTiling)));
			o.Normal = nm * fixed3(_NormalPower, _NormalPower, 1);
			
			
			//rim lighting
			float rim = dot(o.Normal, IN.viewDir);
			
			o.Albedo = c.rgb;
			o.Emission = max(0, (pow(1 - rim, _RimPower) * _RimColor.rgb));	
		
		}

		void tonemapping (Input IN, SurfaceOutputStandardSpecular o, inout fixed4 color) {
        	color = ApplyColorGrading(color);
    	}		
		ENDCG

		CGPROGRAM
		#pragma surface surf StandardSpecular finalcolor:tonemapping alphatest:Cutoff vertex:vert
		#include "ToneMapping.cginc"

		#pragma target 3.0


		sampler2D _MainTex;
		sampler2D _BumpMap;


        float _AlphaOutline, _AlphaPower, _furOffset;
        half4 _RimColor;
        float _RimPower;

		void vert(inout appdata_full v){
			v.vertex.xyz = v.vertex.xyz + v.normal.xyz * _furOffset;
		}

		struct Input {
			float2 uv_MainTex;
			float2 uv_BumpMap;
			float3 viewDir;
			float3 worldNormal; INTERNAL_DATA
		};

		half _Glossiness, _Shininess;
		fixed4 _Color;
		fixed _NormalPower, _NormalTiling;



		void surf (Input IN, inout SurfaceOutputStandardSpecular o) {
			// Albedo comes from a texture tinted by color
			fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
						
			
			//Metallic and smoothness come from slider variables
			o.Smoothness = _Glossiness;
			o.Specular = _Shininess;
			fixed3 nm = UnpackNormal(tex2D(_BumpMap, fixed2(IN.uv_MainTex.x * _NormalTiling, IN.uv_MainTex.y * _NormalTiling)));
			o.Normal = nm * fixed3(_NormalPower, _NormalPower, 1);
			
			
			//rim lighting
			float rim = dot(o.Normal, IN.viewDir);

			o.Albedo = c.rgb;
			o.Emission = max(0, (pow(1 - rim, _RimPower) * _RimColor.rgb));
			fixed3 nmAlpha = UnpackNormal(tex2D(_BumpMap, IN.uv_MainTex * _AlphaOutline));
			o.Alpha = dot(nmAlpha * fixed3(_AlphaPower, _AlphaPower, 1), IN.viewDir);
		
		}

		void tonemapping (Input IN, SurfaceOutputStandardSpecular o, inout fixed4 color) {
        	color = ApplyColorGrading(color);
    	}		
		ENDCG
	}
		FallBack "Wit/Standard(NoColor)"
}
